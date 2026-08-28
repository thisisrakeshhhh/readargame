'use client';

import React from 'react';
import { GeoLocation } from '../types/tactical';
import { Target2D } from './RadarCanvas2D';
import { Radio, Crosshair, Cpu, Volume2, VolumeX, RotateCcw, X } from 'lucide-react';

interface RadarControlsHUDProps {
  location: GeoLocation;
  stats: { intercepted: number; impacts: number; targets: number };
  radarRangeKm: number;
  autoIntercept: boolean;
  isMuted: boolean;
  selectedTarget: Target2D | null;
  onSetRadarRange: (range: number) => void;
  onToggleAutoIntercept: () => void;
  onToggleMute: () => void;
  onInterceptTarget: (target: Target2D) => void;
  onManualStrike: () => void;
  onDeselectTarget: () => void;
  onReturnToStart: () => void;
}

export const RadarControlsHUD: React.FC<RadarControlsHUDProps> = ({
  location,
  stats,
  radarRangeKm,
  autoIntercept,
  isMuted,
  selectedTarget,
  onSetRadarRange,
  onToggleAutoIntercept,
  onToggleMute,
  onInterceptTarget,
  onManualStrike,
  onDeselectTarget,
  onReturnToStart,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 sm:p-4 select-none font-mono text-emerald-400">
      
      {/* 1. TOP HUD BAR */}
      <div className="w-full flex items-center justify-between gap-2 bg-black/90 border border-emerald-500/50 px-3 py-2 rounded-xl backdrop-blur-md pointer-events-auto text-xs shadow-[0_0_20px_rgba(0,0,0,0.8)]">
        
        {/* Left: Flag & Location */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{location.flag}</span>
          <div className="flex items-center gap-1.5 truncate">
            <span className="hidden md:inline font-black text-emerald-300 tracking-wider">READAR</span>
            <span className="hidden md:inline text-zinc-600">|</span>
            <span className="text-emerald-300 font-bold uppercase truncate text-[11px] sm:text-xs">
              {location.name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Center: Live Telemetry */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="hidden sm:inline">ONLINE</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span>INT: <strong className="text-emerald-300 font-bold">{stats.intercepted}</strong></span>
          <span className="text-zinc-600">|</span>
          <span>HIT: <strong className="text-red-400 font-bold">{stats.impacts}</strong></span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReturnToStart}
            className="px-2 py-1 rounded bg-zinc-900 border border-emerald-900 hover:border-emerald-500 text-zinc-300 hover:text-emerald-300 flex items-center gap-1 transition-all cursor-pointer text-[10px] font-bold"
            title="Change Location"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">CHANGE</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-1 rounded bg-zinc-900 border border-emerald-900 hover:border-emerald-500 text-zinc-300 hover:text-emerald-300 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>

      </div>

      {/* 2. FLOATING TARGET CARD (Appears when a target is clicked) */}
      {selectedTarget && (
        <div className="self-end mr-1 sm:mr-2 bg-black/95 border border-red-500 p-3 rounded-xl text-xs space-y-2 max-w-xs w-60 shadow-[0_0_25px_rgba(239,68,68,0.4)] pointer-events-auto backdrop-blur-lg">
          <div className="flex items-center justify-between border-b border-red-900/80 pb-1">
            <span className="font-black text-red-400 tracking-wider">TARGET {selectedTarget.callsign}</span>
            <button onClick={onDeselectTarget} className="text-zinc-400 hover:text-red-300 p-0.5 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] text-red-200">
            <div>STATUS: <strong className="text-red-400">{selectedTarget.isScanned ? selectedTarget.status : 'UNSCANNED'}</strong></div>
            <div>UNIT: <strong className="text-amber-300 font-bold">{selectedTarget.category}</strong></div>
            <div>ARMOR: <strong className={selectedTarget.hp > 1 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{selectedTarget.hp}/{selectedTarget.maxHp} HP</strong></div>
            <div>SPEED: <strong className="text-white">{selectedTarget.speedKmS} KM/S</strong></div>
            <div className="col-span-2">DIST: <strong className="text-amber-300">{selectedTarget.distanceKm} KM</strong></div>
          </div>

          <button
            onClick={() => onInterceptTarget(selectedTarget)}
            className="w-full py-2 rounded bg-red-600 hover:bg-red-500 active:scale-95 text-black font-black text-[11px] flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(239,68,68,0.6)] cursor-pointer transition-all uppercase"
          >
            <Crosshair className="w-3.5 h-3.5" /> STRIKE TARGET
          </button>
        </div>
      )}

      {/* 3. BOTTOM HUD CONTROLS BAR */}
      <div className="w-full flex items-center justify-between gap-2 bg-black/90 border border-emerald-500/50 px-3 py-2 rounded-xl backdrop-blur-md pointer-events-auto text-xs shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-x-auto custom-scrollbar">
        
        {/* Left: Range Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline text-[10px] text-emerald-600 font-bold">RANGE:</span>
          <div className="flex gap-1">
            {[50, 100, 250, 500].map((r) => (
              <button
                key={r}
                onClick={() => onSetRadarRange(r)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  radarRangeKm === r
                    ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                    : 'bg-zinc-950 border border-emerald-950 text-emerald-600 hover:border-emerald-700'
                }`}
              >
                {r}K
              </button>
            ))}
          </div>
        </div>

        {/* Center: Radar Scanning Status */}
        <div className="hidden md:flex items-center gap-2 text-[10px] text-emerald-500 shrink-0">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>ACTIVE</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-emerald-900/60 text-emerald-400 font-mono text-[9px]">
            [ SPACE: FIRE ]
          </span>
        </div>

        {/* Right: Manual Strike Button & Auto Intercept Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onManualStrike}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-black font-black text-[11px] flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all cursor-pointer uppercase"
            title="Launch Interceptor Strike"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>STRIKE</span>
          </button>

          <button
            onClick={onToggleAutoIntercept}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              autoIntercept
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-zinc-950 border-emerald-800 text-emerald-400 hover:border-emerald-500'
            }`}
          >
            {autoIntercept ? (
              <>
                <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>AUTO: ON</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                <span>AUTO: OFF</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 4. MOBILE FLOATING FIRE TRIGGER BUTTON */}
      <div className="sm:hidden fixed bottom-16 right-3 pointer-events-auto z-50">
        <button
          onClick={onManualStrike}
          className="w-16 h-16 rounded-full bg-red-600 active:scale-90 text-black font-black flex flex-col items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.8)] border-2 border-red-300 cursor-pointer"
        >
          <Crosshair className="w-7 h-7 animate-pulse" />
          <span className="text-[10px] font-black tracking-tighter">FIRE</span>
        </button>
      </div>

    </div>
  );
};
