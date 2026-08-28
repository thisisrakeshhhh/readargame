'use client';

import React from 'react';
import { GeoLocation, Target2D } from '../types/tactical';
import { Radio, Crosshair, Cpu, Volume2, VolumeX, RotateCcw, X, Zap } from 'lucide-react';

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
  onDeselectTarget,
  onReturnToStart,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 md:p-5 select-none font-mono text-emerald-400">
      
      {/* 1. COMPACT TOP HUD */}
      <div className="w-full flex items-center justify-between gap-3 bg-black/85 border border-emerald-500/40 px-4 py-2 rounded-xl backdrop-blur-md pointer-events-auto text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        
        {/* Left: Brand & Location */}
        <div className="flex items-center gap-3">
          <span className="text-xl">{location.flag}</span>
          <div className="flex items-center gap-2">
            <span className="font-black text-emerald-300 tracking-wider">READAR</span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-400 font-bold uppercase">{location.name.toUpperCase()}</span>
          </div>
        </div>

        {/* Center: Live Telemetry */}
        <div className="hidden sm:flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ONLINE</span>
          </div>

          <span className="text-zinc-600">|</span>
          <span>INTERCEPTED: <strong className="text-emerald-300">{stats.intercepted}</strong></span>
          <span className="text-zinc-600">|</span>
          <span>IMPACTS: <strong className="text-red-400">{stats.impacts}</strong></span>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReturnToStart}
            className="px-2.5 py-1 rounded bg-zinc-950 border border-emerald-900 hover:border-emerald-500 text-zinc-400 hover:text-emerald-300 flex items-center gap-1 transition-all cursor-pointer text-[10px]"
            title="Change Location"
          >
            <RotateCcw className="w-3 h-3" /> LOCATION
          </button>

          <button
            onClick={onToggleMute}
            className="p-1 rounded bg-zinc-950 border border-emerald-900 hover:border-emerald-500 text-zinc-400 hover:text-emerald-300 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>

      </div>

      {/* 2. FLOATING SMALL TARGET CARD (Appears when a target is clicked) */}
      {selectedTarget && (
        <div className="self-end mr-2 bg-black/90 border border-red-500/80 p-3.5 rounded-xl text-xs space-y-2.5 max-w-xs w-64 shadow-[0_0_25px_rgba(239,68,68,0.35)] pointer-events-auto backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-red-900/60 pb-1.5">
            <div className="flex items-center gap-1.5 font-black text-red-400 tracking-wider">
              <span>{selectedTarget.symbol}</span>
              <span>TARGET {selectedTarget.callsign}</span>
            </div>
            <button onClick={onDeselectTarget} className="text-zinc-500 hover:text-red-300 p-0.5 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-red-200">
            <div>STATUS: <strong className="text-red-400">{selectedTarget.status}</strong></div>
            <div>TYPE: <strong className="text-white">{selectedTarget.category}</strong></div>
            <div>SPEED: <strong className="text-white">{selectedTarget.speedKmS} KM/S</strong></div>
            <div>DISTANCE: <strong className="text-amber-300">{selectedTarget.distanceKm} KM</strong></div>
          </div>

          <button
            onClick={() => onInterceptTarget(selectedTarget)}
            className="w-full py-2 rounded bg-red-600 hover:bg-red-500 text-black font-black text-[11px] flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(239,68,68,0.5)] cursor-pointer transition-all uppercase"
          >
            <Crosshair className="w-3.5 h-3.5" /> INTERCEPT TARGET
          </button>
        </div>
      )}

      {/* 3. COMPACT BOTTOM HUD */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/85 border border-emerald-500/40 px-4 py-2 rounded-xl backdrop-blur-md pointer-events-auto text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        
        {/* Left: Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-600 font-bold uppercase">RANGE:</span>
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
                {r}KM
              </button>
            ))}
          </div>
        </div>

        {/* Center: Spacebar Quick Intercept Hint */}
        <div className="hidden md:flex items-center gap-2 text-[10px] text-emerald-500/80">
          <span className="bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 text-emerald-300 font-mono">[SPACE]</span>
          <span>QUICK INTERCEPT CLOSEST HOSTILE</span>
        </div>

        {/* Right: Auto Intercept Toggle */}
        <button
          onClick={onToggleAutoIntercept}
          className={`px-3 py-1.5 rounded border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            autoIntercept
              ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'bg-zinc-950 border-emerald-800 text-emerald-400 hover:border-emerald-500'
          }`}
        >
          {autoIntercept ? (
            <>
              <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>AUTO INTERCEPT: ON</span>
            </>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>MODE: MANUAL</span>
            </>
          )}
        </button>

      </div>

    </div>
  );
};
