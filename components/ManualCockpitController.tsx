'use client';

import React, { useEffect } from 'react';
import { TacticalMissile, TacticalContact } from '../types/tactical';
import { Navigation, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, X } from 'lucide-react';

interface ManualCockpitControllerProps {
  missile: TacticalMissile;
  targetContact?: TacticalContact;
  onSteer: (headingDelta: number) => void;
  onDetonate: () => void;
  onClose: () => void;
}

export const ManualCockpitController: React.FC<ManualCockpitControllerProps> = ({
  missile,
  targetContact,
  onSteer,
  onDetonate,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') onSteer(-2);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') onSteer(2);
      if (e.key === ' ' || e.key === 'Enter') onDetonate();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSteer, onDetonate]);

  return (
    <div className="fixed bottom-24 right-6 bg-black/90 border border-cyan-500/60 p-4 rounded-xl text-cyan-400 font-mono shadow-[0_0_30px_rgba(6,182,212,0.35)] z-40 max-w-xs backdrop-blur-md">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-800/60 pb-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase">
          <Navigation className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span>MANUAL MISSILE GUIDANCE</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-cyan-300 text-xs cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-cyan-200 mb-3 bg-cyan-950/40 p-2 rounded">
        <div>MISSILE: <strong className="text-white">{missile.id.substring(0, 8)}</strong></div>
        <div>SPEED: <strong className="text-white">MACH {missile.speedMach.toFixed(1)}</strong></div>
        <div>ALTITUDE: <strong className="text-white">{missile.currentAltKm.toFixed(0)} KM</strong></div>
        <div>FUEL: <strong className="text-emerald-400">{missile.fuelPercent.toFixed(0)}%</strong></div>
        <div>TARGET: <strong className="text-red-400">{targetContact?.callsign || 'LOCKED'}</strong></div>
        <div>PROGRESS: <strong className="text-cyan-300">{(missile.flightProgress * 100).toFixed(0)}%</strong></div>
      </div>

      {/* Onscreen D-Pad Controls */}
      <div className="grid grid-cols-3 gap-1.5 w-36 mx-auto mb-3">
        <div />
        <button
          onClick={() => onSteer(0)}
          className="p-2 rounded bg-cyan-950/80 border border-cyan-500 hover:bg-cyan-800 text-cyan-200 flex items-center justify-center cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <div />
        <button
          onClick={() => onSteer(-3)}
          className="p-2 rounded bg-cyan-950/80 border border-cyan-500 hover:bg-cyan-800 text-cyan-200 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onDetonate}
          className="p-2 rounded bg-red-950 border border-red-500 hover:bg-red-800 text-red-300 font-bold text-[10px] flex items-center justify-center cursor-pointer"
        >
          <Crosshair className="w-4 h-4 text-red-400" />
        </button>
        <button
          onClick={() => onSteer(3)}
          className="p-2 rounded bg-cyan-950/80 border border-cyan-500 hover:bg-cyan-800 text-cyan-200 flex items-center justify-center cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <div />
        <button
          onClick={() => onSteer(0)}
          className="p-2 rounded bg-cyan-950/80 border border-cyan-500 hover:bg-cyan-800 text-cyan-200 flex items-center justify-center cursor-pointer"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <div />
      </div>

      <div className="text-[9px] text-center text-cyan-500/80 uppercase">
        USE [A / D] OR ARROW KEYS TO STEER | [SPACE] DETONATE
      </div>

    </div>
  );
};
