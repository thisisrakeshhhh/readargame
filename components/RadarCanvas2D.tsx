'use client';

import React, { useRef, useEffect } from 'react';
import { GeoLocation, Target2D, Interceptor2D, Explosion2D, TargetCategory } from '../types/tactical';
import { audioEngine } from './AudioEngine';

interface RadarCanvas2DProps {
  location: GeoLocation;
  radarRangeKm: number;
  autoIntercept: boolean;
  selectedTarget: Target2D | null;
  onSelectTarget: (target: Target2D | null) => void;
  onUpdateStats: (update: (prev: { intercepted: number; impacts: number; targets: number }) => { intercepted: number; impacts: number; targets: number }) => void;
}

export const RadarCanvas2D: React.FC<RadarCanvas2DProps> = ({
  location,
  radarRangeKm,
  autoIntercept,
  selectedTarget,
  onSelectTarget,
  onUpdateStats,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-performance simulation refs (Run inside 60 FPS requestAnimationFrame with delta-time)
  const targetsRef = useRef<Target2D[]>([]);
  const interceptorsRef = useRef<Interceptor2D[]>([]);
  const explosionsRef = useRef<Explosion2D[]>([]);
  const sweepAngleRef = useRef(0);
  const autoInterceptRef = useRef(autoIntercept);
  autoInterceptRef.current = autoIntercept;

  const selectedTargetIdRef = useRef<string | null>(selectedTarget?.id || null);
  selectedTargetIdRef.current = selectedTarget?.id || null;

  const onSelectTargetRef = useRef(onSelectTarget);
  onSelectTargetRef.current = onSelectTarget;

  const onUpdateStatsRef = useRef(onUpdateStats);
  onUpdateStatsRef.current = onUpdateStats;

  // Launch Interceptor Function
  const launchInterceptorAt = (target: Target2D) => {
    if (target.isIntercepting) return;
    target.isIntercepting = true;
    target.aiState = 'INTERCEPTING';

    interceptorsRef.current.push({
      id: `int-${Date.now()}-${Math.random()}`,
      targetId: target.id,
      x: 0,
      y: 0,
      speedPxS: 260, // High-speed interceptor px/sec
    });

    audioEngine.playMissileLaunch();
  };

  // Expose launch function to parent or window
  useEffect(() => {
    (window as any).__launchInterceptor = launchInterceptorAt;
  }, []);

  // Keyboard shortcut: [SPACE] Quick Intercept closest hostile target
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const hostiles = targetsRef.current.filter((t) => t.status === 'HOSTILE' && !t.isIntercepting);
        if (hostiles.length > 0) {
          hostiles.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
          launchInterceptorAt(hostiles[0]);
          onSelectTargetRef.current(hostiles[0]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main 60 FPS Delta-Time Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let previousTime = performance.now();
    let spawnTimer = 0;
    let autoAiTimer = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const callsignLetters = ['A', 'B', 'V', 'K', 'X', 'Z', 'C', 'D'];
    const categories: { cat: TargetCategory; symbol: string; speedMult: number; isHostile: boolean }[] = [
      { cat: 'BALLISTIC', symbol: '▲', speedMult: 1.4, isHostile: true },
      { cat: 'CRUISE', symbol: '×', speedMult: 0.9, isHostile: true },
      { cat: 'UAV', symbol: '◇', speedMult: 0.7, isHostile: true },
      { cat: 'AIRCRAFT', symbol: '✈', speedMult: 1.0, isHostile: true },
      { cat: 'HYPERSONIC', symbol: '⚡', speedMult: 2.0, isHostile: true },
      { cat: 'UNKNOWN', symbol: '●', speedMult: 0.8, isHostile: false },
    ];

    // Target Spawner Helper
    const spawnTarget = () => {
      const w = canvas.width;
      const h = canvas.height;
      const radarRadius = Math.min(w, h) * 0.22; // Small radar (35-40% viewport)

      // Spawn 1.2x to 2.4x radar radius away on outer perimeter
      const angle = Math.random() * Math.PI * 2;
      const dist = radarRadius * (1.2 + Math.random() * 1.2);
      const spawnX = Math.cos(angle) * dist;
      const spawnY = Math.sin(angle) * dist;

      const typeConfig = categories[Math.floor(Math.random() * categories.length)];
      const baseSpeed = 22 * typeConfig.speedMult; // px/sec
      const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 0.3;
      const vx = Math.cos(targetAngle) * baseSpeed;
      const vy = Math.sin(targetAngle) * baseSpeed;

      const idNum = Math.floor(10 + Math.random() * 89);
      const letter = callsignLetters[Math.floor(Math.random() * callsignLetters.length)];

      const newTarget: Target2D = {
        id: `target-${Date.now()}-${Math.random()}`,
        callsign: `${letter}-${idNum}`,
        category: typeConfig.cat,
        symbol: typeConfig.symbol,
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        speedKmS: parseFloat(((baseSpeed / 8) * 1.2).toFixed(1)),
        distanceKm: Math.round((dist / radarRadius) * radarRangeKm),
        status: 'UNKNOWN',
        aiState: 'OUTSIDE',
        isIntercepting: false,
        scanPulse: 0,
        lastScannedAngle: -999,
        trail: [[spawnX, spawnY]],
      };

      targetsRef.current.push(newTarget);
    };

    // Pre-populate with 4 initial targets
    targetsRef.current = [];
    interceptorsRef.current = [];
    explosionsRef.current = [];
    for (let i = 0; i < 5; i++) {
      spawnTarget();
    }

    // MAIN 60 FPS RENDER & SIMULATION LOOP
    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const deltaTime = Math.min(0.1, (currentTime - previousTime) / 1000);
      previousTime = currentTime;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radarRadius = Math.min(w, h) * 0.22; // Small radar overlay (~35-40% viewport)

      // 1. UPDATE RADAR SWEEP (Smooth 60 FPS rotation)
      sweepAngleRef.current = (sweepAngleRef.current + 1.5 * deltaTime) % (Math.PI * 2);
      const sweepAngle = sweepAngleRef.current;

      // 2. PERIODIC TARGET SPAWNING (Maintains 4-7 active targets)
      spawnTimer += deltaTime;
      if (spawnTimer > 3.8 && targetsRef.current.length < 7) {
        spawnTimer = 0;
        spawnTarget();
      }

      // 3. FAST AUTO INTERCEPT AI STATE MACHINE
      if (autoInterceptRef.current) {
        autoAiTimer += deltaTime;
        if (autoAiTimer > 0.25) { // AI decision tick every 250ms for instant responsiveness
          autoAiTimer = 0;

          // Find closest hostile target inside radar range without active interceptor
          const eligibleTargets = targetsRef.current.filter((t) => {
            const d = Math.hypot(t.x, t.y);
            return (
              t.status === 'HOSTILE' &&
              d <= radarRadius * 1.15 &&
              !t.isIntercepting
            );
          });

          if (eligibleTargets.length > 0) {
            eligibleTargets.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
            const targetToEngage = eligibleTargets[0];
            launchInterceptorAt(targetToEngage);
          }
        }
      }

      // 4. UPDATE TARGETS PHYSICS & RADAR SWEEP DETECTION
      const activeTargets: Target2D[] = [];
      for (let i = 0; i < targetsRef.current.length; i++) {
        const t = targetsRef.current[i];

        // Real-time delta-time movement
        t.x += t.vx * deltaTime;
        t.y += t.vy * deltaTime;
        t.distanceKm = Math.round((Math.hypot(t.x, t.y) / radarRadius) * radarRangeKm);

        // Record trail (max 25 points)
        if (Math.random() < 0.3) {
          t.trail.push([t.x, t.y]);
          if (t.trail.length > 25) t.trail.shift();
        }

        // Pulse decay
        if (t.scanPulse > 0) {
          t.scanPulse = Math.max(0, t.scanPulse - 1.8 * deltaTime);
        }

        const distFromCenter = Math.hypot(t.x, t.y);
        const inRadar = distFromCenter <= radarRadius;

        // Check sweep crossing angle
        let targetAngle = Math.atan2(t.y, t.x);
        if (targetAngle < 0) targetAngle += Math.PI * 2;

        const angleDiff = Math.abs(sweepAngle - targetAngle);
        if (inRadar && (angleDiff < 0.14 || Math.abs(angleDiff - Math.PI * 2) < 0.14)) {
          if (Math.abs(sweepAngle - t.lastScannedAngle) > 0.4) {
            t.lastScannedAngle = sweepAngle;
            t.scanPulse = 1.0;
            audioEngine.playRadarPing();

            if (t.status === 'UNKNOWN') {
              t.status = 'SCANNING';
              t.aiState = 'DETECTED';
            } else if (t.status === 'SCANNING') {
              t.status = t.category !== 'UNKNOWN' ? 'HOSTILE' : 'UNKNOWN';
              t.aiState = t.category !== 'UNKNOWN' ? 'LOCKED' : 'TRACKING';
            }
          }
        }

        // Check Base Impact
        if (distFromCenter < 14) {
          audioEngine.playExplosion();
          explosionsRef.current.push({
            id: `exp-${Date.now()}`,
            x: t.x,
            y: t.y,
            radius: 4,
            maxRadius: 26,
            progress: 0,
            color: '#ef4444',
          });
          onUpdateStatsRef.current((prev) => ({ ...prev, impacts: prev.impacts + 1 }));
          if (selectedTargetIdRef.current === t.id) {
            onSelectTargetRef.current(null);
          }
        } else {
          activeTargets.push(t);
        }
      }
      targetsRef.current = activeTargets;

      // 5. UPDATE INTERCEPTORS FLIGHT & CONTINUOUS HOMING
      const activeInterceptors: Interceptor2D[] = [];
      for (let i = 0; i < interceptorsRef.current.length; i++) {
        const int = interceptorsRef.current[i];
        const target = targetsRef.current.find((t) => t.id === int.targetId);

        if (!target) {
          continue; // Target destroyed
        }

        // Homing vector towards moving target
        const dx = target.x - int.x;
        const dy = target.y - int.y;
        const distToTarget = Math.hypot(dx, dy);

        if (distToTarget < 14) {
          // Intercept Hit!
          audioEngine.playExplosion();
          explosionsRef.current.push({
            id: `exp-${Date.now()}`,
            x: target.x,
            y: target.y,
            radius: 5,
            maxRadius: 30,
            progress: 0,
            color: '#22c55e',
          });

          // Destroy target
          targetsRef.current = targetsRef.current.filter((t) => t.id !== int.targetId);
          onUpdateStatsRef.current((prev) => ({ ...prev, intercepted: prev.intercepted + 1 }));

          if (selectedTargetIdRef.current === int.targetId) {
            onSelectTargetRef.current(null);
          }
        } else {
          // Continuous movement towards target
          const step = int.speedPxS * deltaTime;
          int.x += (dx / distToTarget) * step;
          int.y += (dy / distToTarget) * step;
          activeInterceptors.push(int);
        }
      }
      interceptorsRef.current = activeInterceptors;

      // 6. UPDATE EXPLOSIONS
      explosionsRef.current = explosionsRef.current
        .map((e) => ({ ...e, progress: e.progress + 2.0 * deltaTime }))
        .filter((e) => e.progress < 1.0);

      // ==========================================
      // CANVAS RENDERING (REAL LOCAL VECTOR MAP + RADAR)
      // ==========================================

      // Clear Canvas Background
      ctx.fillStyle = '#06080c';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);

      // 7. DRAW REAL LOCAL GEOGRAPHIC MAP CONTEXT (Zero Network Latency)
      const scale = radarRadius / 100; // px per km scale

      // Draw local geographic features (cities, rivers, borders, airbases)
      if (location.features) {
        location.features.forEach((feat) => {
          const fx = feat.dx * scale;
          const fy = feat.dy * scale;

          if (feat.type === 'river' && feat.path) {
            ctx.strokeStyle = 'rgba(30, 95, 130, 0.45)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            feat.path.forEach(([px, py], idx) => {
              if (idx === 0) ctx.moveTo(px * scale, py * scale);
              else ctx.lineTo(px * scale, py * scale);
            });
            ctx.stroke();

            ctx.fillStyle = 'rgba(30, 95, 130, 0.6)';
            ctx.font = '8px monospace';
            const mid = feat.path[Math.floor(feat.path.length / 2)];
            ctx.fillText(feat.name, mid[0] * scale + 4, mid[1] * scale);
          } else if ((feat.type === 'border' || feat.type === 'coastline') && feat.path) {
            ctx.strokeStyle = feat.type === 'coastline' ? 'rgba(50, 110, 160, 0.5)' : 'rgba(70, 90, 110, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            feat.path.forEach(([px, py], idx) => {
              if (idx === 0) ctx.moveTo(px * scale, py * scale);
              else ctx.lineTo(px * scale, py * scale);
            });
            ctx.stroke();
            ctx.setLineDash([]);
          } else if (feat.type === 'city') {
            // City Dot & Subtle Name
            ctx.fillStyle = 'rgba(100, 130, 160, 0.6)';
            ctx.beginPath();
            ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(120, 150, 180, 0.7)';
            ctx.font = '9px monospace';
            ctx.fillText(`• ${feat.name}`, fx + 5, fy + 3);
          } else if (feat.type === 'airbase' || feat.type === 'naval_base') {
            ctx.fillStyle = 'rgba(52, 211, 153, 0.6)';
            ctx.font = '9px monospace';
            ctx.fillText(`▲ ${feat.name}`, fx + 5, fy + 3);

            ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
            ctx.beginPath();
            ctx.arc(fx, fy, 3, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      }

      // 8. DRAW SMALL TACTICAL RADAR OVERLAY (~35-40% Viewport, Vibrant Green)
      // Outer Radar Ring
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, radarRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Concentric Range Rings
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1.0].forEach((frac) => {
        ctx.beginPath();
        ctx.arc(0, 0, radarRadius * frac, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 8 Radial Bearing Lines
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.22)';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * radarRadius, Math.sin(a) * radarRadius);
        ctx.stroke();
      }

      // Base Center Marker
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Radar Sweep Line & Faint Glow Wedge
      ctx.save();
      ctx.rotate(sweepAngle);

      const wedgeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radarRadius);
      wedgeGradient.addColorStop(0, 'rgba(34, 197, 94, 0.28)');
      wedgeGradient.addColorStop(1, 'rgba(34, 197, 94, 0.03)');

      ctx.fillStyle = wedgeGradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radarRadius, -0.45, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radarRadius, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // 9. DRAW TARGETS (Small Crisp Military Markers)
      targetsRef.current.forEach((t) => {
        const isSelected = selectedTargetIdRef.current === t.id;

        // Trail Line
        if (t.trail.length > 1) {
          ctx.strokeStyle = t.status === 'HOSTILE' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.25)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(t.trail[0][0], t.trail[0][1]);
          for (let i = 1; i < t.trail.length; i++) {
            ctx.lineTo(t.trail[i][0], t.trail[i][1]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Pulse Ring on Radar Sweep Crossing
        if (t.scanPulse > 0) {
          ctx.strokeStyle = `rgba(34, 197, 94, ${t.scanPulse * 0.85})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 5 + (1 - t.scanPulse) * 10, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw Target Marker
        if (t.status === 'HOSTILE') {
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#ef4444';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(t.symbol, t.x - 4, t.y + 4);

          // Tiny Label
          ctx.fillStyle = '#f87171';
          ctx.font = '9px monospace';
          ctx.fillText(`${t.callsign}`, t.x + 6, t.y - 2);
        } else {
          // Amber Unknown Dot ●
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbbf24';
          ctx.font = '8px monospace';
          ctx.fillText('UNK', t.x + 5, t.y - 2);
        }

        // Highlight Lock Box if selected or locked by AI
        if (isSelected || t.aiState === 'LOCKED' || t.aiState === 'INTERCEPTING') {
          ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(t.x - 7, t.y - 7, 14, 14);
        }
      });

      // 10. DRAW INTERCEPTORS (High-Speed Cyan Missile Streaks)
      interceptorsRef.current.forEach((int) => {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(int.x, int.y);
        ctx.stroke();

        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(int.x, int.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // 11. DRAW EXPLOSIONS (Expanding Shockwave Rings)
      explosionsRef.current.forEach((exp) => {
        const curRadius = exp.radius + (exp.maxRadius - exp.radius) * exp.progress;
        const alpha = Math.max(0, 1 - exp.progress);

        ctx.strokeStyle = exp.color === '#ef4444' ? `rgba(239, 68, 68, ${alpha})` : `rgba(34, 197, 94, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, curRadius, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.restore();
    };

    animId = requestAnimationFrame(animate);

    // CLICK LISTENER TO SELECT TARGET
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left - canvas.width / 2;
      const clickY = e.clientY - rect.top - canvas.height / 2;

      let found: Target2D | null = null;
      let minDistance = 22;

      targetsRef.current.forEach((t) => {
        const d = Math.hypot(t.x - clickX, t.y - clickY);
        if (d < minDistance) {
          minDistance = d;
          found = t;
        }
      });

      onSelectTargetRef.current(found);
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [location, radarRangeKm]);

  return <canvas ref={canvasRef} className="w-full h-full absolute inset-0 z-10 cursor-crosshair" />;
};
