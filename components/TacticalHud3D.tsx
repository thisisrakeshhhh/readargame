'use client';

import React, { useState } from 'react';
import {
  GeoLocation,
  TacticalContact,
  TacticalMission,
  IntelLog,
  TacticalStats,
  RadarRange,
  DefenseMode,
  WeaponSystem,
} from '../types/tactical';
import {
  Radio,
  Shield,
  Crosshair,
  Cpu,
  Target,
  Navigation,
  Volume2,
  VolumeX,
  Eye,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface TacticalHud3DProps {
  location: GeoLocation;
  stats: TacticalStats;
  radarRange: RadarRange;
  defenseMode: DefenseMode;
  selectedContact: TacticalContact | null;
  activeMissions: TacticalMission[];
  intelLogs: IntelLog[];
  activeWeapons: Record<string, WeaponSystem>;
  isMuted: boolean;
  onSetRadarRange: (range: RadarRange) => void;
  onToggleDefenseMode: () => void;
  onToggleMute: () => void;
  onTrackContact: (contact: TacticalContact) => void;
  onOpenInterceptSequence: (contact: TacticalContact) => void;
  onReturnToOrbit: () => void;
}

export const TacticalHud3D: React.FC<TacticalHud3DProps> = ({
  location,
  stats,
  radarRange,
  defenseMode,
  selectedContact,
  activeMissions,
  intelLogs,
  activeWeapons,
  isMuted,
  onSetRadarRange,
  onToggleDefenseMode,
  onToggleMute,
  onTrackContact,
  onOpenInterceptSequence,
  onReturnToOrbit,
}) => {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 md:p-5 select-none font-mono text-emerald-400">
      
      {/* 1. TOP COMMAND BAR */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2 bg-black/80 border border-emerald-500/40 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)] pointer-events-auto">
        
        {/* Left: Operation & Location Details */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{location.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-emerald-300 tracking-wider">READAR COMMAND</span>
              <span className="text-[10px] text-zinc-500">|</span>
              <span className="text-[11px] text-emerald-400 font-bold uppercase">OPERATION NIGHT WATCH</span>
            </div>
            <div className="text-[10px] text-emerald-500/80 flex items-center gap-3">
              <span>LOCATION: <strong className="text-emerald-300">{location.name.toUpperCase()}</strong></span>
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <Navigation className="w-3 h-3 animate-spin-slow" />
                {location.lat.toFixed(2)}°N, {location.lng.toFixed(2)}°E
              </span>
            </div>
          </div>
        </div>

        {/* Center: System Telemetry Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>SYSTEM: <strong>ONLINE</strong></span>
          </div>

          <div className="text-[11px] bg-emerald-950/60 border border-emerald-700/60 px-2 py-0.5 rounded flex items-center gap-2">
            <span>THREAT: <strong className="text-amber-400">{stats.threatLevel}</strong></span>
            <span>WAVE: <strong className="text-emerald-300">{String(stats.wave).padStart(2, '0')}</strong></span>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[11px]">
            <span>KILLS: <strong className="text-emerald-300">{stats.intercepted}</strong></span>
            <span>IMPACTS: <strong className="text-red-400">{stats.impacts}</strong></span>
            <span>SCORE: <strong className="text-amber-300">{stats.score}</strong></span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onReturnToOrbit}
            className="px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 hover:border-emerald-500 text-zinc-400 hover:text-emerald-300 flex items-center gap-1 transition-all cursor-pointer text-[10px]"
            title="Return to Global View"
          >
            <RotateCcw className="w-3.5 h-3.5" /> GLOBAL
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded bg-zinc-950 border border-zinc-800 hover:border-emerald-500 text-zinc-400 hover:text-emerald-300 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

      </div>

      {/* 2. MAIN CENTER AREA WITH FLOATING SIDE PANELS */}
      <div className="flex-1 flex justify-between items-start gap-4 my-3 overflow-hidden pointer-events-none">
        
        {/* LEFT PANEL: Active Missions & Radar Range Controls */}
        {leftPanelOpen && (
          <div className="w-72 bg-black/85 border border-emerald-500/40 rounded-xl p-3.5 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)] pointer-events-auto space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar">
            
            {/* Missions Header */}
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>ACTIVE MISSIONS</span>
              </div>
              <span className="text-[10px] bg-emerald-950 px-1.5 py-0.2 rounded text-emerald-400">
                {activeMissions.length}
              </span>
            </div>

            {/* Missions List */}
            <div className="space-y-2">
              {activeMissions.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/50 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span>{m.code}</span>
                    <span className="text-[9px] text-amber-400 font-mono">{m.status}</span>
                  </div>
                  <div className="text-emerald-200 font-semibold">{m.title}</div>
                  <p className="text-[10px] text-emerald-400/80 leading-tight">{m.objective}</p>
                </div>
              ))}
            </div>

            {/* Radar Range Selector */}
            <div className="pt-2 border-t border-emerald-900/60">
              <label className="block text-[10px] font-bold text-emerald-400/80 mb-1.5 uppercase">
                RADAR TACTICAL RANGE
              </label>
              <div className="grid grid-cols-4 gap-1">
                {([50, 100, 250, 500] as RadarRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => onSetRadarRange(r)}
                    className={`py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      radarRange === r
                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                        : 'bg-zinc-950 border border-emerald-950 text-emerald-500 hover:border-emerald-700'
                    }`}
                  >
                    {r}KM
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* RIGHT PANEL: Live Intelligence Feed & Target Inspector */}
        {rightPanelOpen && (
          <div className="w-80 bg-black/85 border border-emerald-500/40 rounded-xl p-3.5 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)] pointer-events-auto space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar ml-auto">
            
            {/* Selected Contact Inspector */}
            {selectedContact ? (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/60 space-y-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <div className="flex items-center justify-between border-b border-red-900/60 pb-1.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                    <span className="font-bold text-xs text-red-300">TRACK {selectedContact.callsign}</span>
                  </div>
                  <span className="text-[9px] bg-red-950 px-1.5 py-0.5 rounded text-red-300 font-bold border border-red-800">
                    {selectedContact.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-red-200">
                  <div>TYPE: <strong className="text-white">{selectedContact.type.replace('HOSTILE_', '')}</strong></div>
                  <div>SPEED: <strong className="text-white">{selectedContact.velocityKmS.toFixed(1)} KM/S</strong></div>
                  <div>HEADING: <strong className="text-white">{selectedContact.headingDeg}°</strong></div>
                  <div>THREAT: <strong className="text-amber-400">{selectedContact.threatLevel}</strong></div>
                  <div>ALTITUDE: <strong className="text-white">{selectedContact.altKm.toFixed(0)} KM</strong></div>
                  <div>ETA: <strong className="text-red-400 font-bold">{selectedContact.etaSeconds}s</strong></div>
                </div>

                {/* Actions on Target */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onTrackContact(selectedContact)}
                    className="py-1.5 rounded bg-zinc-950 border border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> TRACK
                  </button>

                  <button
                    onClick={() => onOpenInterceptSequence(selectedContact)}
                    className="py-1.5 rounded bg-red-600 hover:bg-red-500 text-black font-black text-[10px] flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(239,68,68,0.5)] cursor-pointer transition-all uppercase"
                  >
                    <Crosshair className="w-3.5 h-3.5" /> INTERCEPT
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-emerald-950 text-center text-[10px] text-zinc-500">
                CLICK ANY 3D CONTACT ON THE WORLD TO INSPECT TELEMETRY
              </div>
            )}

            {/* Live Intelligence Event Stream */}
            <div className="space-y-1.5 pt-1 border-t border-emerald-900/60">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-300 mb-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>INTELLIGENCE STREAM</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-[10px]">
                {intelLogs.slice(-6).map((log) => (
                  <div key={log.id} className="p-1.5 rounded bg-black/60 border border-emerald-950/80 flex gap-2">
                    <span className="text-zinc-500 font-mono shrink-0">{log.timestamp}</span>
                    <span className="text-emerald-400/90">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 3. BOTTOM WEAPON QUICKBAR & CONTROL SWITCH */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 bg-black/85 border border-emerald-500/40 px-4 py-3 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)] pointer-events-auto">
        
        {/* Weapon Inventories */}
        <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto">
          {Object.values(activeWeapons).map((w) => (
            <div
              key={w.id}
              className="p-2 rounded bg-emerald-950/50 border border-emerald-800/60 text-[10px] min-w-[120px] flex items-center justify-between gap-2"
            >
              <div>
                <div className="font-bold text-emerald-300">{w.name}</div>
                <div className="text-[9px] text-emerald-500/70">M{w.speedMach} | {w.rangeKm}KM</div>
              </div>
              <span className="text-xs font-black text-amber-300 bg-black/70 px-1.5 py-0.5 rounded border border-emerald-900">
                {w.ammo}/{w.maxAmmo}
              </span>
            </div>
          ))}
        </div>

        {/* Defense Mode Switch (MANUAL vs AUTO AI) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDefenseMode}
            className={`px-4 py-2.5 rounded-lg border text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              defenseMode === 'AUTO'
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
          >
            {defenseMode === 'AUTO' ? (
              <>
                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>MODE: AUTO AI (IRON DOME)</span>
              </>
            ) : (
              <>
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <span>MODE: MANUAL OPERATOR</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
