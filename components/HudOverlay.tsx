'use client';

import React, { useState } from 'react';
import { Country, DefenseMode, GameStats, ScreenView } from '../types/game';
import { AnalyticsModal } from './AnalyticsModal';
import { Volume2, VolumeX, Crosshair, Cpu, Swords, Radar, BarChart3, Navigation } from 'lucide-react';

interface HudOverlayProps {
  country: Country;
  defenseMode: DefenseMode;
  currentScreen: ScreenView;
  stats: GameStats;
  isMuted: boolean;
  onToggleDefenseMode: () => void;
  onSwitchScreen: (screen: ScreenView) => void;
  onToggleMute: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  country,
  defenseMode,
  currentScreen,
  stats,
  isMuted,
  onToggleDefenseMode,
  onSwitchScreen,
  onToggleMute,
}) => {
  const [showAnalytics, setShowAnalytics] = useState(false);

  const accuracy = stats.shotsFired > 0 ? ((stats.intercepted / stats.shotsFired) * 100).toFixed(0) : '0';

  return (
    <div className="w-full bg-black/90 border-b border-green-500/40 p-3 md:p-4 text-green-400 font-mono flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-40">
      
      {/* Country, Base Telemetry & Real-Time GPS Location */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{country.flag}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-green-300 uppercase">{country.name} NORAD GRID</span>
            <span className="text-[10px] bg-green-950 border border-green-700/60 px-1.5 py-0.5 rounded text-green-400">
              WAVE {stats.wave}
            </span>
          </div>

          <div className="text-[10px] text-green-500/80 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            <span className="flex items-center gap-1 text-cyan-300 font-bold">
              <Navigation className="w-3 h-3 text-cyan-400 animate-spin-slow" />
              GPS REALTIME: {country.lat.toFixed(2)}°N, {country.lng.toFixed(2)}°E
            </span>
            <span>SHOTS: <span className="font-bold text-green-300">{stats.shotsFired}</span></span>
            <span>ACCURACY: <span className="font-bold text-cyan-300">{accuracy}%</span></span>
            <span>SHIELD: <span className="font-bold text-amber-300">{stats.integrity}%</span></span>
          </div>
        </div>
      </div>

      {/* Controls, Analytics & Mode Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        
        {/* Screen Switcher Tabs */}
        <button
          onClick={() => onSwitchScreen('defense')}
          className={`py-2 px-3 rounded border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            currentScreen === 'defense'
              ? 'bg-green-950 border-green-400 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Radar className="w-4 h-4" /> DEFENSE RADAR
        </button>

        <button
          onClick={() => onSwitchScreen('attack')}
          className={`py-2 px-3 rounded border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            currentScreen === 'attack'
              ? 'bg-red-950 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Swords className="w-4 h-4 text-red-400" /> ATTACK STRIKE
        </button>

        {/* Defense Mode Toggle */}
        <button
          onClick={onToggleDefenseMode}
          className="py-2 px-3 rounded border border-green-600/60 bg-green-950/60 hover:bg-green-900 text-green-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {defenseMode === 'manual' ? (
            <>
              <Crosshair className="w-4 h-4 text-green-400" /> MODE: MANUAL
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" /> MODE: AUTO AI
            </>
          )}
        </button>

        {/* Analytics Modal Button */}
        <button
          onClick={() => setShowAnalytics(true)}
          className="py-2 px-3 rounded border border-amber-600/60 bg-amber-950/40 hover:bg-amber-900 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <BarChart3 className="w-4 h-4 text-amber-400" /> ANALYTICS
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleMute}
          className="p-2 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-green-400 transition-all cursor-pointer"
          title="Toggle Audio"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
        </button>

      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <AnalyticsModal
          stats={stats}
          country={country}
          onClose={() => setShowAnalytics(false)}
        />
      )}

    </div>
  );
};
