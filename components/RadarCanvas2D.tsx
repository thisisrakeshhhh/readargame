'use client';

import React, { useRef, useEffect, useState } from 'react';
import { GeoLocation } from '../types/tactical';
import { WORLD_COASTLINES } from '../utils/mapData';
import { audioEngine } from './AudioEngine';

export interface Target2D {
  id: string;
  callsign: string;
  type: 'HOSTILE' | 'UNKNOWN' | 'FRIENDLY';
  x: number; // Offset in px relative to radar center
  y: number;
  vx: number; // Velocity in px/sec
  vy: number;
  speedKmS: number;
  distanceKm: number;
  status: 'UNKNOWN' | 'SCANNING' | 'HOSTILE';
  scanPulse: number; // 0 to 1
  lastScannedAngle: number;
  trail: [number, number][];
}

export interface Interceptor2D {
  id: string;
  targetId: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  speed: number;
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

  // Mutable Simulation Refs (Run inside 60 FPS requestAnimationFrame with delta-time)
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
    interceptorsRef.current.push({
      id: `int-${Date.now()}-${Math.random()}`,
      targetId: target.id,
      x: 0,
      y: 0,
      startX: 0,
      startY: 0,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      speed: 1.4, // Progress per second
    });
    audioEngine.playMissileLaunch();
  };

  // Expose launch function to parent or click handlers
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
    let autoInterceptTimer = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initial Spawn of Targets
    const callsignLetters = ['A', 'B', 'X', 'K', 'V', 'Z', 'C', 'D'];
    const spawnTarget = () => {
      const w = canvas.width;
      const h = canvas.height;
      const radarRadius = Math.min(w, h) * 0.32;

      // Spawn targets 0.7x to 1.8x radar radius away
      const angle = Math.random() * Math.PI * 2;
      const dist = radarRadius * (0.8 + Math.random() * 0.9);
      const spawnX = Math.cos(angle) * dist;
      const spawnY = Math.sin(angle) * dist;

      // Aim towards base center with slight drift
      const speed = 25 + Math.random() * 35; // px per second
      const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 0.4;
      const vx = Math.cos(targetAngle) * speed;
      const vy = Math.sin(targetAngle) * speed;

      const isHostile = Math.random() < 0.65;
      const idNum = Math.floor(10 + Math.random() * 89);
      const letter = callsignLetters[Math.floor(Math.random() * callsignLetters.length)];

      const newTarget: Target2D = {
        id: `target-${Date.now()}-${Math.random()}`,
        callsign: `${letter}-${idNum}`,
        type: isHostile ? 'HOSTILE' : 'UNKNOWN',
        x: spawnX,
        y: spawnY,
        vx,
        vy,
        speedKmS: parseFloat(((speed / 10) * 1.2).toFixed(1)),
        distanceKm: Math.round((dist / radarRadius) * radarRangeKm),
        status: 'UNKNOWN',
        scanPulse: 0,
        lastScannedAngle: -999,
        trail: [[spawnX, spawnY]],
      };

      targetsRef.current.push(newTarget);
    };

    // Pre-populate with 4 initial targets
    for (let i = 0; i < 4; i++) {
      spawnTarget();
    }

    // MAIN ANIMATION & SIMULATION LOOP
    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const deltaTime = Math.min(0.1, (currentTime - previousTime) / 1000);
      previousTime = currentTime;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radarRadius = Math.min(w, h) * 0.32; // 50-65% of viewport width/height

      // 1. UPDATE RADAR SWEEP (Smooth 60 FPS rotation)
      sweepAngleRef.current = (sweepAngleRef.current + 1.2 * deltaTime) % (Math.PI * 2);
      const sweepAngle = sweepAngleRef.current;

      // 2. PERIODIC TARGET SPAWNING (every 4.5 seconds)
      spawnTimer += deltaTime;
      if (spawnTimer > 4.5 && targetsRef.current.length < 12) {
        spawnTimer = 0;
        spawnTarget();
      }

      // 3. AUTO INTERCEPT LOGIC
      if (autoInterceptRef.current) {
        autoInterceptTimer += deltaTime;
        if (autoInterceptTimer > 1.8) {
          autoInterceptTimer = 0;
          const hostileTarget = targetsRef.current.find(
            (t) => t.status === 'HOSTILE' && Math.hypot(t.x, t.y) < radarRadius * 0.95
          );
          if (hostileTarget) {
            launchInterceptorAt(hostileTarget);
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
          t.scanPulse = Math.max(0, t.scanPulse - 1.5 * deltaTime);
        }

        const distFromCenter = Math.hypot(t.x, t.y);
        const inRadar = distFromCenter <= radarRadius;

        // Check sweep crossing angle
        let targetAngle = Math.atan2(t.y, t.x);
        if (targetAngle < 0) targetAngle += Math.PI * 2;

        const angleDiff = Math.abs(sweepAngle - targetAngle);
        if (inRadar && (angleDiff < 0.1 || Math.abs(angleDiff - Math.PI * 2) < 0.1)) {
          if (Math.abs(sweepAngle - t.lastScannedAngle) > 0.5) {
            t.lastScannedAngle = sweepAngle;
            t.scanPulse = 1.0;
            audioEngine.playRadarPing();

            if (t.status === 'UNKNOWN') {
              t.status = 'SCANNING';
            } else if (t.status === 'SCANNING') {
              t.status = t.type === 'HOSTILE' ? 'HOSTILE' : 'UNKNOWN';
            }
          }
        }

        // Check Base Impact
        if (distFromCenter < 18) {
          audioEngine.playExplosion();
          explosionsRef.current.push({
            id: `exp-${Date.now()}`,
            x: t.x,
            y: t.y,
            radius: 5,
            maxRadius: 28,
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

      // 5. UPDATE INTERCEPTORS FLIGHT
      const activeInterceptors: Interceptor2D[] = [];
      for (let i = 0; i < interceptorsRef.current.length; i++) {
        const int = interceptorsRef.current[i];
        int.progress += int.speed * deltaTime;

        // Follow target position
        const target = targetsRef.current.find((t) => t.id === int.targetId);
        if (target) {
          int.targetX = target.x;
          int.targetY = target.y;
        }

        int.x = int.startX + (int.targetX - int.startX) * int.progress;
        int.y = int.startY + (int.targetY - int.startY) * int.progress;

        if (int.progress >= 1.0) {
          // Intercept Detonation!
          audioEngine.playExplosion();
          explosionsRef.current.push({
            id: `exp-${Date.now()}`,
            x: int.targetX,
            y: int.targetY,
            radius: 5,
            maxRadius: 32,
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
          activeInterceptors.push(int);
        }
      }
      interceptorsRef.current = activeInterceptors;

      // 6. UPDATE EXPLOSIONS
      explosionsRef.current = explosionsRef.current
        .map((e) => ({ ...e, progress: e.progress + 1.8 * deltaTime }))
        .filter((e) => e.progress < 1.0);

      // ==========================================
      // CANVAS RENDERING (PURE 2D CLEAN TACTICAL)
      // ==========================================

      // 7. Clear Background (Pure Deep Tactical Black)
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, w, h);

      // 8. Draw 2D Background Geographic Map Context
      ctx.save();
      ctx.translate(cx, cy);

      // Draw subtle continent / coastline polygons
      const currentRegion = location.id.includes('india')
        ? 'india'
        : location.id.includes('ukraine') || location.id.includes('europe') || location.id.includes('russia')
        ? 'europe'
        : location.id.includes('usa')
        ? 'usa'
        : 'global';

      const coastlines = WORLD_COASTLINES[currentRegion] || WORLD_COASTLINES.global;

      // Water background tint
      ctx.fillStyle = '#09101a';
      ctx.strokeStyle = 'rgba(70, 110, 160, 0.3)';
      ctx.lineWidth = 1.2;

      coastlines.forEach((pathStr) => {
        const path = new Path2D();
        const mapScale = radarRadius * 2.8;

        // Parse simplified normalized SVG-like path string
        const commands = pathStr.split(' ');
        let isFirst = true;

        for (let i = 0; i < commands.length; i++) {
          const cmd = commands[i];
          if (cmd === 'M' || cmd === 'L') {
            const [px, py] = commands[i + 1].split(',').map(Number);
            if (isFirst) {
              path.moveTo(px * mapScale, py * mapScale);
              isFirst = false;
            } else {
              path.lineTo(px * mapScale, py * mapScale);
            }
            i++;
          } else if (cmd === 'Z') {
            path.closePath();
          }
        }

        ctx.fill(path);
        ctx.stroke(path);
      });

      // Subtle Regional Country Borders & Labels
      ctx.fillStyle = 'rgba(70, 110, 160, 0.4)';
      ctx.font = '11px monospace';
      ctx.fillText(location.country.toUpperCase(), -radarRadius * 1.3, -radarRadius * 1.1);
      ctx.fillText(`SECTOR: ${location.name.toUpperCase()}`, -radarRadius * 1.3, -radarRadius * 1.1 + 14);

      // 9. DRAW TACTICAL RADAR OVERLAY (50-65% of Viewport, Vibrant Tactical Green)
      // Radar Outer Boundary Glow
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radarRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Radar Concentric Range Rings (Thin Crisp Lines)
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)';
      ctx.lineWidth = 1;
      const ringSteps = [0.25, 0.5, 0.75, 1.0];
      ringSteps.forEach((fraction) => {
        ctx.beginPath();
        ctx.arc(0, 0, radarRadius * fraction, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 8 Radial Bearing Lines
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * radarRadius, Math.sin(a) * radarRadius);
        ctx.stroke();
      }

      // Central Base Defense Dot
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Radar Sweep Line & Faint Glow Wedge
      ctx.save();
      ctx.rotate(sweepAngle);

      // Sweep trailing wedge
      const wedgeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radarRadius);
      wedgeGradient.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
      wedgeGradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');

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

      // 10. DRAW TARGETS (Small, Subtle Tactical Blips)
      targetsRef.current.forEach((t) => {
        const isSelected = selectedTargetIdRef.current === t.id;

        // Trail Line
        if (t.trail.length > 1) {
          ctx.strokeStyle = t.status === 'HOSTILE' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.25)';
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
          ctx.strokeStyle = `rgba(34, 197, 94, ${t.scanPulse * 0.8})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 6 + (1 - t.scanPulse) * 10, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Target Marker
        if (t.status === 'HOSTILE') {
          // Small Red Cross ×
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = isSelected ? 2.5 : 1.8;
          ctx.beginPath();
          ctx.moveTo(t.x - 3.5, t.y - 3.5);
          ctx.lineTo(t.x + 3.5, t.y + 3.5);
          ctx.moveTo(t.x + 3.5, t.y - 3.5);
          ctx.lineTo(t.x - 3.5, t.y + 3.5);
          ctx.stroke();

          // Tiny Label
          ctx.fillStyle = '#f87171';
          ctx.font = '10px monospace';
          ctx.fillText(t.callsign, t.x + 6, t.y - 3);
        } else {
          // Amber / Yellow Dot ●
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbbf24';
          ctx.font = '9px monospace';
          ctx.fillText('UNK', t.x + 5, t.y - 2);
        }

        // Highlight Lock Box if selected
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(t.x - 8, t.y - 8, 16, 16);
        }
      });

      // 11. DRAW INTERCEPTORS (Small Cyan Missile Streaks)
      interceptorsRef.current.forEach((int) => {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(int.startX, int.startY);
        ctx.lineTo(int.x, int.y);
        ctx.stroke();

        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(int.x, int.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // 12. DRAW EXPLOSIONS (Expanding Shockwave Rings)
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

      // Find nearest target within 24px click threshold
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

  return <canvas ref={canvasRef} className="w-full h-full absolute inset-0 z-0 cursor-crosshair" />;
};
