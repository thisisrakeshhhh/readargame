'use client';

import React, { useRef, useEffect } from 'react';
import { GeoLocation } from '../types/tactical';
import { audioEngine } from './AudioEngine';

export type TargetCategory = 'MISSILE' | 'UAV' | 'DRONE' | 'JET' | 'TANK' | 'BOMBER' | 'HELICOPTER';

export interface Target2D {
  id: string;
  callsign: string;
  category: TargetCategory;
  type: 'HOSTILE' | 'UNKNOWN' | 'FRIENDLY';
  x: number; // Offset in px relative to radar center
  y: number;
  vx: number; // Velocity in px/sec
  vy: number;
  speedKmS: number;
  distanceKm: number;
  status: 'UNKNOWN' | 'SCANNING' | 'HOSTILE';
  aiState: 'OUTSIDE' | 'DETECTED' | 'TRACKING' | 'LOCKED' | 'INTERCEPTING' | 'DESTROYED';
  isScanned: boolean; // Must be true before striking
  isIntercepting: boolean;
  scanPulse: number; // 0 to 1
  lastScannedAngle: number;
  trail: [number, number][];
}

export interface Interceptor2D {
  id: string;
  targetId: string;
  x: number;
  y: number;
  speedPxS: number;
  trail: [number, number][];
}

export interface Explosion2D {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  progress: number;
  color: string;
}

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

  // Mutable Simulation Refs
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

  // Launch Interceptor at a Target Function
  const launchInterceptorAt = (target: Target2D) => {
    if (target.isIntercepting) return;
    target.isIntercepting = true;
    target.aiState = 'INTERCEPTING';

    interceptorsRef.current.push({
      id: `int-${Date.now()}-${Math.random()}`,
      targetId: target.id,
      x: 0,
      y: 0,
      speedPxS: 250, // High-speed interceptor
      trail: [[0, 0]],
    });

    audioEngine.playMissileLaunch();
  };

  // Expose launch function to parent
  useEffect(() => {
    (window as any).__launchInterceptor = launchInterceptorAt;
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

    const categories: { category: TargetCategory; prefix: string; baseSpeed: number }[] = [
      { category: 'MISSILE', prefix: 'MSL', baseSpeed: 38 },
      { category: 'JET', prefix: 'JET', baseSpeed: 28 },
      { category: 'UAV', prefix: 'UAV', baseSpeed: 20 },
      { category: 'DRONE', prefix: 'DRN', baseSpeed: 18 },
      { category: 'TANK', prefix: 'TNK', baseSpeed: 12 },
      { category: 'BOMBER', prefix: 'BMB', baseSpeed: 19 },
      { category: 'HELICOPTER', prefix: 'HELI', baseSpeed: 15 },
    ];

    // Target Spawner Helper
    const spawnTarget = () => {
      const w = canvas.width;
      const h = canvas.height;
      const radarRadius = Math.min(w, h) * 0.32;

      // Spawn around outer radar perimeter (0.85x to 1.5x radius)
      const angle = Math.random() * Math.PI * 2;
      const dist = radarRadius * (0.85 + Math.random() * 0.65);
      const spawnX = Math.cos(angle) * dist;
      const spawnY = Math.sin(angle) * dist;

      // Pick random military category
      const catConfig = categories[Math.floor(Math.random() * categories.length)];
      const speed = catConfig.baseSpeed + (Math.random() - 0.5) * 6; // px/sec
      const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 0.25;
      const vx = Math.cos(targetAngle) * speed;
      const vy = Math.sin(targetAngle) * speed;

      const idNum = Math.floor(10 + Math.random() * 89);
      const callsign = `${catConfig.prefix}-${idNum}`;

      const newTarget: Target2D = {
        id: `target-${Date.now()}-${Math.random()}`,
        callsign,
        category: catConfig.category,
        type: 'HOSTILE',
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        speedKmS: parseFloat(((speed / 10) * 1.3).toFixed(1)),
        distanceKm: Math.round((dist / radarRadius) * radarRangeKm),
        status: 'UNKNOWN',
        aiState: 'OUTSIDE',
        isScanned: false,
        isIntercepting: false,
        scanPulse: 0,
        lastScannedAngle: -999,
        trail: [[spawnX, spawnY]],
      };

      targetsRef.current.push(newTarget);
    };

    // Pre-populate with diverse targets
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
      const radarRadius = Math.min(w, h) * 0.32; // 50-65% of viewport

      // 1. UPDATE RADAR SWEEP (Smooth 60 FPS Rotation)
      sweepAngleRef.current = (sweepAngleRef.current + 1.35 * deltaTime) % (Math.PI * 2);
      const sweepAngle = sweepAngleRef.current;

      // 2. PERIODIC TARGET SPAWNING (Maintains 4-7 active threats continuously)
      spawnTimer += deltaTime;
      if (spawnTimer > 3.6 && targetsRef.current.length < 7) {
        spawnTimer = 0;
        spawnTarget();
      }

      // 3. FIRST SCAN, THEN STRIKE AI LOGIC
      if (autoInterceptRef.current) {
        autoAiTimer += deltaTime;
        if (autoAiTimer > 0.25) { // Fast AI evaluation tick
          autoAiTimer = 0;

          // Target must be SCANNED by the radar sweep before launching a strike!
          const targetsToStrike = targetsRef.current.filter((t) => {
            const d = Math.hypot(t.x, t.y);
            return (
              t.isScanned &&
              t.status === 'HOSTILE' &&
              d <= radarRadius * 0.98 &&
              !t.isIntercepting
            );
          });

          // Launch interceptor strikes against scanned threats
          targetsToStrike.forEach((targetToEngage) => {
            launchInterceptorAt(targetToEngage);
          });
        }
      }

      // 4. UPDATE TARGETS PHYSICS & RADAR SWEEP DETECTION
      const activeTargets: Target2D[] = [];
      for (let i = 0; i < targetsRef.current.length; i++) {
        const t = targetsRef.current[i];

        // Real-time movement
        t.x += t.vx * deltaTime;
        t.y += t.vy * deltaTime;
        const distFromCenter = Math.hypot(t.x, t.y);
        t.distanceKm = Math.round((distFromCenter / radarRadius) * radarRangeKm);

        // Record trail
        if (Math.random() < 0.3) {
          t.trail.push([t.x, t.y]);
          if (t.trail.length > 20) t.trail.shift();
        }

        // Pulse decay
        if (t.scanPulse > 0) {
          t.scanPulse = Math.max(0, t.scanPulse - 1.5 * deltaTime);
        }

        const inRadar = distFromCenter <= radarRadius;

        // SWEEP CROSSING DETECTION (FIRST SCAN!)
        let targetAngle = Math.atan2(t.y, t.x);
        if (targetAngle < 0) targetAngle += Math.PI * 2;

        const angleDiff = Math.abs(sweepAngle - targetAngle);
        if (inRadar && (angleDiff < 0.12 || Math.abs(angleDiff - Math.PI * 2) < 0.12)) {
          if (Math.abs(sweepAngle - t.lastScannedAngle) > 0.4) {
            t.lastScannedAngle = sweepAngle;
            t.scanPulse = 1.0;
            t.isScanned = true; // SCANNED!
            t.status = 'HOSTILE';
            t.aiState = 'LOCKED';
            audioEngine.playRadarPing();
          }
        }

        // Proximity emergency scan if target gets dangerously close (<45% radius)
        if (distFromCenter < radarRadius * 0.45 && !t.isScanned) {
          t.isScanned = true;
          t.status = 'HOSTILE';
          t.aiState = 'LOCKED';
        }

        // Base Impact
        if (distFromCenter < 16) {
          audioEngine.playExplosion();
          explosionsRef.current.push({
            id: `exp-${Date.now()}`,
            x: t.x,
            y: t.y,
            radius: 5,
            maxRadius: 32,
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

      // 5. UPDATE INTERCEPTORS FLIGHT & HOMING
      const activeInterceptors: Interceptor2D[] = [];
      for (let i = 0; i < interceptorsRef.current.length; i++) {
        const int = interceptorsRef.current[i];
        const target = targetsRef.current.find((t) => t.id === int.targetId);

        if (!target) {
          continue;
        }

        const dx = target.x - int.x;
        const dy = target.y - int.y;
        const distToTarget = Math.hypot(dx, dy);

        if (distToTarget < 15) {
          // Detonation Hit!
          audioEngine.playExplosion();
          explosionsRef.current.push({
            id: `exp-${Date.now()}`,
            x: target.x,
            y: target.y,
            radius: 6,
            maxRadius: 34,
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
          const moveStep = int.speedPxS * deltaTime;
          int.x += (dx / distToTarget) * moveStep;
          int.y += (dy / distToTarget) * moveStep;

          int.trail.push([int.x, int.y]);
          if (int.trail.length > 15) int.trail.shift();

          activeInterceptors.push(int);
        }
      }
      interceptorsRef.current = activeInterceptors;

      // 6. UPDATE EXPLOSIONS
      explosionsRef.current = explosionsRef.current
        .map((e) => ({ ...e, progress: e.progress + 1.8 * deltaTime }))
        .filter((e) => e.progress < 1.0);

      // ==========================================
      // CANVAS RENDERING
      // ==========================================

      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);

      // 7. DRAW TACTICAL RADAR OVERLAY
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radarRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Range Rings
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)';
      ctx.lineWidth = 1;
      const ringSteps = [0.25, 0.5, 0.75, 1.0];
      ringSteps.forEach((fraction) => {
        ctx.beginPath();
        ctx.arc(0, 0, radarRadius * fraction, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 8 Bearing Radial Lines
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * radarRadius, Math.sin(a) * radarRadius);
        ctx.stroke();
      }

      // Base Center Dot
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Radar Sweep Line & Wedge
      ctx.save();
      ctx.rotate(sweepAngle);

      const wedgeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radarRadius);
      wedgeGradient.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
      wedgeGradient.addColorStop(1, 'rgba(34, 197, 94, 0.03)');

      ctx.fillStyle = wedgeGradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radarRadius, -0.45, 0);
      ctx.closePath();
      ctx.fill();

      // Main Sweep Line
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radarRadius, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // 8. DRAW TARGETS (Custom icons for MISSILE, JET, UAV, DRONE, TANK, BOMBER, HELICOPTER)
      targetsRef.current.forEach((t) => {
        const isSelected = selectedTargetIdRef.current === t.id;

        // Trail Line
        if (t.trail.length > 1) {
          ctx.strokeStyle = t.isScanned ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.25)';
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

        // Pulse Ring on Scan
        if (t.scanPulse > 0) {
          ctx.strokeStyle = `rgba(34, 197, 94, ${t.scanPulse * 0.9})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 6 + (1 - t.scanPulse) * 12, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (t.isScanned) {
          // SCANNED HOSTILE TARGET — Render Category Tactical Icon
          ctx.strokeStyle = '#ef4444';
          ctx.fillStyle = '#ef4444';
          ctx.lineWidth = isSelected ? 2.5 : 1.8;

          if (t.category === 'MISSILE') {
            // Sharp chevron / needle ▲
            ctx.beginPath();
            ctx.moveTo(t.x, t.y - 6);
            ctx.lineTo(t.x - 4, t.y + 4);
            ctx.lineTo(t.x, t.y + 2);
            ctx.lineTo(t.x + 4, t.y + 4);
            ctx.closePath();
            ctx.stroke();
          } else if (t.category === 'JET') {
            // Swept fighter jet ✈
            ctx.beginPath();
            ctx.moveTo(t.x, t.y - 5);
            ctx.lineTo(t.x - 5, t.y + 1);
            ctx.lineTo(t.x - 2, t.y + 3);
            ctx.lineTo(t.x - 3, t.y + 5);
            ctx.lineTo(t.x, t.y + 4);
            ctx.lineTo(t.x + 3, t.y + 5);
            ctx.lineTo(t.x + 2, t.y + 3);
            ctx.lineTo(t.x + 5, t.y + 1);
            ctx.closePath();
            ctx.stroke();
          } else if (t.category === 'UAV' || t.category === 'DRONE') {
            // Tactical diamond ◇ with center blip
            ctx.beginPath();
            ctx.moveTo(t.x, t.y - 5);
            ctx.lineTo(t.x + 5, t.y);
            ctx.lineTo(t.x, t.y + 5);
            ctx.lineTo(t.x - 5, t.y);
            ctx.closePath();
            ctx.stroke();
            ctx.fillRect(t.x - 1, t.y - 1, 2, 2);
          } else if (t.category === 'TANK') {
            // Armored square ■ with barrel
            ctx.strokeRect(t.x - 4, t.y - 3, 8, 6);
            ctx.beginPath();
            ctx.moveTo(t.x, t.y - 3);
            ctx.lineTo(t.x, t.y - 6);
            ctx.stroke();
          } else if (t.category === 'BOMBER') {
            // Heavy delta wing
            ctx.beginPath();
            ctx.moveTo(t.x, t.y - 5);
            ctx.lineTo(t.x - 7, t.y + 4);
            ctx.lineTo(t.x + 7, t.y + 4);
            ctx.closePath();
            ctx.stroke();
          } else {
            // Crisp Red Cross ×
            ctx.beginPath();
            ctx.moveTo(t.x - 4, t.y - 4);
            ctx.lineTo(t.x + 4, t.y + 4);
            ctx.moveTo(t.x + 4, t.y - 4);
            ctx.lineTo(t.x - 4, t.y + 4);
            ctx.stroke();
          }

          // Category + Callsign Label
          ctx.fillStyle = '#f87171';
          ctx.font = '9px monospace';
          ctx.fillText(`${t.callsign}`, t.x + 7, t.y - 2);
        } else {
          // UNSCANNED (Amber Dot Blip)
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbbf24';
          ctx.font = '8px monospace';
          ctx.fillText('UNK', t.x + 5, t.y - 2);
        }

        // Highlight Lock Box if selected
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(t.x - 9, t.y - 9, 18, 18);
        }
      });

      // 9. DRAW INTERCEPTOR STRIKES
      interceptorsRef.current.forEach((int) => {
        // Strike Beam from Base to Missile Head
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(int.x, int.y);
        ctx.stroke();

        // Glowing Missile Head
        ctx.fillStyle = '#67e8f9';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(int.x, int.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 10. DRAW EXPLOSIONS
      explosionsRef.current.forEach((exp) => {
        const curRadius = exp.radius + (exp.maxRadius - exp.radius) * exp.progress;
        const alpha = Math.max(0, 1 - exp.progress);

        ctx.strokeStyle = exp.color === '#ef4444' ? `rgba(239, 68, 68, ${alpha})` : `rgba(34, 197, 94, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, curRadius, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.restore();
    };

    animId = requestAnimationFrame(animate);

    // Click to Select Target
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left - canvas.width / 2;
      const clickY = e.clientY - rect.top - canvas.height / 2;

      let found: Target2D | null = null;
      let minDistance = 24;

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
