'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Country,
  DefenseMode,
  Threat,
  Interceptor,
  NavalUnit,
  AirUnit,
  GroundFacility,
  ExplosionEffect,
  GameStats,
  Position,
} from '../types/game';
import {
  CANVAS_SIZE,
  RADAR_CENTER,
  RADAR_RADIUS,
  createThreat,
  updateThreatPosition,
  updateInterceptorPosition,
  findAutoTarget,
  getDistance,
} from '../utils/radarPhysics';
import { WORLD_COASTLINES } from '../utils/mapData';
import { audioEngine } from './AudioEngine';

interface RadarCanvasProps {
  country: Country;
  defenseMode: DefenseMode;
  stats: GameStats;
  onUpdateStats: (updater: (prev: GameStats) => GameStats) => void;
  onSelectInterceptorForManualPilot?: (interceptor: Interceptor) => void;
}

export const RadarCanvas: React.FC<RadarCanvasProps> = ({
  country,
  defenseMode,
  stats,
  onUpdateStats,
  onSelectInterceptorForManualPilot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Entities state
  const threatsRef = useRef<Threat[]>([]);
  const interceptorsRef = useRef<Interceptor[]>([]);
  const explosionsRef = useRef<ExplosionEffect[]>([]);

  // Ground facilities
  const [facilities] = useState<GroundFacility[]>([
    { id: 'silo-1', type: 'sam_silo', name: 'Alpha Silo', position: { x: RADAR_CENTER.x - 60, y: RADAR_CENTER.y + 40 }, health: 100, maxHealth: 100, isOperational: true, ammo: 15, maxAmmo: 15 },
    { id: 'silo-2', type: 'sam_silo', name: 'Bravo Silo', position: { x: RADAR_CENTER.x + 80, y: RADAR_CENTER.y - 50 }, health: 100, maxHealth: 100, isOperational: true, ammo: 15, maxAmmo: 15 },
    { id: 'city-center', type: 'city', name: country.name + ' Base', position: { x: RADAR_CENTER.x, y: RADAR_CENTER.y }, health: 100, maxHealth: 100, isOperational: true },
    { id: 'radar-tower', type: 'radar_tower', name: 'Radar Tower', position: { x: RADAR_CENTER.x - 20, y: RADAR_CENTER.y - 70 }, health: 100, maxHealth: 100, isOperational: true },
  ]);

  // Moving naval ships
  const [ships, setShips] = useState<NavalUnit[]>([
    { id: 'ship-1', type: 'destroyer', name: 'USS Aegis', position: { x: RADAR_CENTER.x + 140, y: RADAR_CENTER.y + 110 }, destination: { x: RADAR_CENTER.x + 160, y: RADAR_CENTER.y - 120 }, speed: 0.15, samAmmo: 10, samMaxAmmo: 10, samRange: 150, health: 100, maxHealth: 100, status: 'patrol' },
    { id: 'ship-2', type: 'carrier', name: 'HMS Horizon', position: { x: RADAR_CENTER.x - 150, y: RADAR_CENTER.y + 130 }, destination: { x: RADAR_CENTER.x - 170, y: RADAR_CENTER.y - 90 }, speed: 0.1, samAmmo: 12, samMaxAmmo: 12, samRange: 180, health: 100, maxHealth: 100, status: 'patrol' },
  ]);

  // Moving air jets
  const [jets] = useState<AirUnit[]>([
    { id: 'jet-1', type: 'fighter', name: 'Viper 1', position: { x: RADAR_CENTER.x - 40, y: RADAR_CENTER.y - 90 }, destination: { x: RADAR_CENTER.x + 100, y: RADAR_CENTER.y + 100 }, speed: 0.5, fuel: 100, maxFuel: 100, ammo: 4, status: 'patrol' },
  ]);

  // Sweep angle & spawn timers
  const sweepAngleRef = useRef<number>(0);
  const nextThreatIdRef = useRef<number>(1);
  const spawnTimerRef = useRef<number>(0);

  // Interceptor launcher function tracking shots fired stats
  const launchInterceptor = useCallback((targetPos: Position, sourcePos?: Position, sourceId?: string, isAuto?: boolean) => {
    let launchFrom = sourcePos;
    let launchId = sourceId;

    if (!launchFrom) {
      let minDist = Infinity;
      for (const fac of facilities) {
        if (fac.isOperational && fac.type === 'sam_silo' && (fac.ammo ?? 1) > 0) {
          const d = getDistance(fac.position, targetPos);
          if (d < minDist) {
            minDist = d;
            launchFrom = fac.position;
            launchId = fac.id;
          }
        }
      }
      for (const ship of ships) {
        if (ship.samAmmo > 0) {
          const d = getDistance(ship.position, targetPos);
          if (d < minDist) {
            minDist = d;
            launchFrom = ship.position;
            launchId = ship.id;
          }
        }
      }
    }

    if (!launchFrom) {
      launchFrom = { ...RADAR_CENTER };
      launchId = 'base';
    }

    const newInterceptor: Interceptor = {
      id: `abm-${Date.now()}-${Math.random()}`,
      type: 'silo_abm',
      sourceId: launchId || 'base',
      position: { ...launchFrom },
      target: targetPos,
      speed: 3.5 * country.interceptorSpeed,
      heading: 0,
      isManualControlled: false,
      explosionRadius: 30,
      fuseDistance: 12,
    };

    interceptorsRef.current.push(newInterceptor);
    audioEngine.playMissileLaunch();

    onUpdateStats((prev) => ({
      ...prev,
      ammo: Math.max(0, prev.ammo - 1),
      shotsFired: prev.shotsFired + 1,
      manualShots: isAuto ? prev.manualShots : prev.manualShots + 1,
      autoShots: isAuto ? prev.autoShots + 1 : prev.autoShots,
    }));
  }, [country.interceptorSpeed, facilities, ships, onUpdateStats]);

  // Handle canvas click to launch manual missile
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (getDistance({ x, y }, RADAR_CENTER) <= RADAR_RADIUS) {
      launchInterceptor({ x, y }, undefined, undefined, false);
    }
  };

  // 60 FPS Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      // 1. Radar Sweep Angle
      sweepAngleRef.current = (sweepAngleRef.current + 0.02) % (Math.PI * 2);
      if (Math.abs(sweepAngleRef.current % (Math.PI / 2)) < 0.02) {
        audioEngine.playRadarPing();
      }

      // 2. Spawn Threats
      spawnTimerRef.current += 1;
      if (spawnTimerRef.current > 120) {
        spawnTimerRef.current = 0;
        const newThreat = createThreat(nextThreatIdRef.current++, stats.wave);
        threatsRef.current.push(newThreat);
        audioEngine.playAlarm();
      }

      let impactsCount = 0;
      let interceptedCount = 0;
      let scoreGained = 0;

      // 3. Update Threat Positions
      const remainingThreats: Threat[] = [];
      for (const t of threatsRef.current) {
        const updated = updateThreatPosition(t);
        if (getDistance(updated.position, updated.target) < 15) {
          impactsCount += 1;
          audioEngine.playExplosion();
          explosionsRef.current.push({
            id: `exp-${Date.now()}`,
            position: updated.position,
            currentRadius: 5,
            maxRadius: 40,
            duration: 30,
            elapsed: 0,
            color: '#ef4444',
          });
        } else {
          remainingThreats.push(updated);
        }
      }
      threatsRef.current = remainingThreats;

      // 4. Auto Defense AI
      if (defenseMode === 'auto' && Math.random() < 0.05) {
        const autoTarget = findAutoTarget(threatsRef.current, interceptorsRef.current, facilities, ships);
        if (autoTarget) {
          launchInterceptor(autoTarget.targetPos, autoTarget.sourcePos, autoTarget.sourceId, true);
        }
      }

      // 5. Update Interceptors & Detonations
      const remainingInterceptors: Interceptor[] = [];
      for (const interceptor of interceptorsRef.current) {
        const updated = updateInterceptorPosition(interceptor);
        const distToTarget = getDistance(updated.position, updated.target);

        if (distToTarget <= updated.fuseDistance) {
          audioEngine.playExplosion();

          const survivedThreats: Threat[] = [];
          for (const t of threatsRef.current) {
            if (getDistance(t.position, updated.position) <= updated.explosionRadius) {
              interceptedCount += 1;
              scoreGained += t.scoreValue;
            } else {
              survivedThreats.push(t);
            }
          }
          threatsRef.current = survivedThreats;

          explosionsRef.current.push({
            id: `exp-${Date.now()}`,
            position: updated.position,
            currentRadius: 5,
            maxRadius: updated.explosionRadius,
            duration: 25,
            elapsed: 0,
            color: '#22c55e',
          });
        } else {
          remainingInterceptors.push(updated);
        }
      }
      interceptorsRef.current = remainingInterceptors;

      // Update Stats Safely
      if (impactsCount > 0 || interceptedCount > 0) {
        onUpdateStats((prev) => ({
          ...prev,
          impacts: prev.impacts + impactsCount,
          integrity: Math.max(0, prev.integrity - impactsCount * 10),
          intercepted: prev.intercepted + interceptedCount,
          score: prev.score + scoreGained,
        }));
      }

      // 6. Update Explosions
      explosionsRef.current = explosionsRef.current
        .map((exp) => ({ ...exp, elapsed: exp.elapsed + 1, currentRadius: exp.maxRadius * ((exp.elapsed + 1) / exp.duration) }))
        .filter((exp) => exp.elapsed < exp.duration);

      // 7. Update Ships
      setShips((prevShips) =>
        prevShips.map((ship) => {
          const angle = Math.atan2(ship.destination.y - ship.position.y, ship.destination.x - ship.position.x);
          if (getDistance(ship.position, ship.destination) < 5) {
            return {
              ...ship,
              destination: {
                x: RADAR_CENTER.x + (Math.random() * 200 - 100),
                y: RADAR_CENTER.y + (Math.random() * 200 - 100),
              },
            };
          }
          return {
            ...ship,
            position: {
              x: ship.position.x + Math.cos(angle) * ship.speed,
              y: ship.position.y + Math.sin(angle) * ship.speed,
            },
          };
        })
      );

      // 8. RENDER CANVAS
      ctx.fillStyle = 'rgba(5, 12, 8, 0.35)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const cx = RADAR_CENTER.x;
      const cy = RADAR_CENTER.y;

      // Draw Map Outline
      const selectedPaths = WORLD_COASTLINES[country.id] || WORLD_COASTLINES['europe'];
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.18)';
      ctx.lineWidth = 1.5;
      for (const d of selectedPaths) {
        const pathObj = new Path2D(d);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(200, 200);
        ctx.stroke(pathObj);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.fill(pathObj);
        ctx.restore();
      }
      ctx.restore();

      // Radar Grid Circles & Degree Lines
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.arc(cx, cy, RADAR_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      const ringSteps = [50, 100, 150, 200, 240];
      ringSteps.forEach((r) => {
        const radiusPx = (r / 250) * RADAR_RADIUS;
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * RADAR_RADIUS, cy + Math.sin(a) * RADAR_RADIUS);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText('000° N', cx - 18, cy - RADAR_RADIUS - 6);
      ctx.fillText('090° E', cx + RADAR_RADIUS + 6, cy + 4);
      ctx.fillText('180° S', cx - 18, cy + RADAR_RADIUS + 14);
      ctx.fillText('270° W', cx - RADAR_RADIUS - 40, cy + 4);

      // Realtime GPS Coordinate Label Overlay (Matching screenshot)
      ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.font = '11px monospace';
      ctx.fillText(`GPS REALTIME: ${country.lat.toFixed(4)}°N, ${country.lng.toFixed(4)}°E`, 20, CANVAS_SIZE - 20);

      // Rotating Sweep Line
      const sweepAngle = sweepAngleRef.current;
      const sweepX = cx + Math.cos(sweepAngle) * RADAR_RADIUS;
      const sweepY = cy + Math.sin(sweepAngle) * RADAR_RADIUS;

      const gradient = ctx.createConicGradient(sweepAngle - Math.PI / 4, cx, cy);
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
      gradient.addColorStop(0.12, 'rgba(34, 197, 94, 0.05)');
      gradient.addColorStop(0.25, 'rgba(34, 197, 94, 0)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, RADAR_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Ground Facilities
      facilities.forEach((fac) => {
        ctx.fillStyle = fac.type === 'city' ? '#38bdf8' : '#eab308';
        ctx.beginPath();
        ctx.arc(fac.position.x, fac.position.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9px monospace';
        ctx.fillText(fac.name, fac.position.x - 20, fac.position.y + 14);
      });

      // Ships
      ships.forEach((ship) => {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(ship.position.x, ship.position.y - 6);
        ctx.lineTo(ship.position.x + 4, ship.position.y + 6);
        ctx.lineTo(ship.position.x - 4, ship.position.y + 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#22d3ee';
        ctx.font = '8px monospace';
        ctx.fillText(`🚢 ${ship.name}`, ship.position.x - 15, ship.position.y + 14);
      });

      // Jets
      jets.forEach((jet) => {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(jet.position.x, jet.position.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.font = '8px monospace';
        ctx.fillText(`✈️ ${jet.name}`, jet.position.x - 12, jet.position.y + 12);
      });

      // Threat Targets
      threatsRef.current.forEach((threat) => {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(threat.position.x, threat.position.y);
        ctx.lineTo(
          threat.position.x - Math.cos(threat.heading * (Math.PI / 180)) * 20,
          threat.position.y - Math.sin(threat.heading * (Math.PI / 180)) * 20
        );
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(threat.position.x, threat.position.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fca5a5';
        ctx.font = '9px monospace';
        ctx.fillText(`⚠️ ${threat.name}`, threat.position.x + 6, threat.position.y + 3);
      });

      // Interceptors
      interceptorsRef.current.forEach((interceptor) => {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(interceptor.position.x, interceptor.position.y);
        ctx.lineTo(interceptor.target.x, interceptor.target.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(interceptor.target.x, interceptor.target.y, 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(interceptor.position.x, interceptor.position.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Explosions
      explosionsRef.current.forEach((exp) => {
        ctx.strokeStyle = exp.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(exp.position.x, exp.position.y, exp.currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = exp.color;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Top-Right Stats HUD Overlay matching uploaded screenshot!
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Intercepted:  ${stats.intercepted}`, CANVAS_SIZE - 20, 35);
      ctx.fillText(`Impact:  ${stats.impacts}`, CANVAS_SIZE - 20, 60);
      ctx.textAlign = 'left';

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [country.id, country.lat, country.lng, defenseMode, facilities, jets, launchInterceptor, onUpdateStats, ships, stats.impacts, stats.intercepted, stats.wave]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleCanvasClick}
        className="border-2 border-green-500/60 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.3)] bg-black cursor-crosshair max-w-full h-auto"
      />
      <div className="mt-2 text-xs text-green-400/70 font-mono tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
        <span>[ CLICK RADAR TO LAUNCH INTERCEPTOR MISSILE ]</span>
      </div>
    </div>
  );
};
