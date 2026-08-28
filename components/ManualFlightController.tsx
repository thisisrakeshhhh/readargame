'use client';

import React, { useEffect, useState } from 'react';
import { Interceptor } from '../types/game';
import { Navigation, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair } from 'lucide-react';

interface ManualFlightControllerProps {
  activeMissile: Interceptor | null;
  onUpdateSteering: (vx: number, vy: number) => void;
  onDetonate: () => void;
  onClose: () => void;
}

export const ManualFlightController: React.FC<ManualFlightControllerProps> = ({
  activeMissile,
  onUpdateSteering,
  onDetonate,
  onClose,
}) => {
  const [speed] = useState(3.5);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let vx = 0;
      let vy = 0;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') vy = -speed;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') vy = speed;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') vx = -speed;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') vx = speed;

      if (vx !== 0 || vy !== 0) {
        onUpdateSteering(vx, vy);
      }

      if (e.key === ' ') {
        onDetonate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speed, onUpdateSteering, onDetonate]);

  if (!activeMissile) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-black/90 border border-cyan-500/60 p-4 rounded-lg text-cyan-400 font-mono shadow-[0_0_20px_rgba(6,182,212,0.3)] z-50 max-w-xs">
      <div className="flex items-center justify-between mb-3 border-b border-cyan-800/60 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
          <Navigation className="w-4 h-4 animate-spin-slow text-cyan-400" />
          <span>MANUAL MISSILE GUIDANCE SYSTEM</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-cyan-400 text-xs">✕</button>
      </div>

      <div className="text-[10px] text-cyan-400/80 mb-3 space-y-1">
        <div>ID: <span className="text-white">{activeMissile.id.substring(0, 12)}</span></div>
        <div>POS: <span className="text-white">X:{Math.round(activeMissile.position.x)} Y:{Math.round(activeMissile.position.y)}</span></div>
        <div>TARGET: <span className="text-white">X:{Math.round(activeMissile.target.x)} Y:{Math.round(activeMissile.target.y)}</span></div>
      </div>

      {/* Touch / On-screen D-pad Controller */}
      <div className="grid grid-cols-3 gap-1 w-32 mx-auto mb-3 text-center">
        <div />
        <button
          onMouseDown={() => onUpdateSteering(0, -speed)}
          className="bg-cyan-950/80 border border-cyan-500 p-2 rounded hover:bg-cyan-700 text-cyan-300"
        >
          <ArrowUp className="w-4 h-4 mx-auto" />
        </button>
        <div />
        <button
          onMouseDown={() => onUpdateSteering(-speed, 0)}
          className="bg-cyan-950/80 border border-cyan-500 p-2 rounded hover:bg-cyan-700 text-cyan-300"
        >
          <ArrowLeft className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={onDetonate}
          className="bg-red-950 border border-red-500 text-red-400 p-2 rounded hover:bg-red-800 font-bold text-[10px] flex items-center justify-center"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onMouseDown={() => onUpdateSteering(speed, 0)}
          className="bg-cyan-950/80 border border-cyan-500 p-2 rounded hover:bg-cyan-700 text-cyan-300"
        >
          <ArrowRight className="w-4 h-4 mx-auto" />
        </button>
        <div />
        <button
          onMouseDown={() => onUpdateSteering(0, speed)}
          className="bg-cyan-950/80 border border-cyan-500 p-2 rounded hover:bg-cyan-700 text-cyan-300"
        >
          <ArrowDown className="w-4 h-4 mx-auto" />
        </button>
        <div />
      </div>

      <div className="text-[9px] text-center text-cyan-400/60 uppercase">
        USE WASD / ARROW KEYS TO STEER | [SPACE] DETONATE
      </div>
    </div>
  );
};
