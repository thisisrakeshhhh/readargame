'use client';

import React from 'react';
import { GameStats, Country } from '../types/game';
import { BarChart3, Crosshair, Cpu, Target, Shield, X, Award, Percent } from 'lucide-react';

interface AnalyticsModalProps {
  stats: GameStats;
  country: Country;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ stats, country, onClose }) => {
  const accuracy = stats.shotsFired > 0 ? ((stats.intercepted / stats.shotsFired) * 100).toFixed(1) : '0.0';

  let rank = 'C';
  const numAcc = parseFloat(accuracy);
  if (numAcc >= 85) rank = 'S';
  else if (numAcc >= 70) rank = 'A';
  else if (numAcc >= 50) rank = 'B';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/95 border-2 border-green-500/60 p-6 rounded-xl text-green-400 font-mono max-w-lg w-full shadow-[0_0_40px_rgba(34,197,94,0.3)] relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-green-800/60 text-green-300">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
            <BarChart3 className="w-5 h-5 text-green-400 animate-pulse" />
            <span>TACTICAL COMBAT TELEMETRY & ANALYTICS</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-green-300 p-1 text-xs">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location & Country Subheader */}
        <div className="bg-green-950/40 border border-green-800/60 p-3 rounded-lg mb-4 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{country.flag}</span>
            <div>
              <div className="font-bold text-green-300">{country.name} NORAD DEFENSE GRID</div>
              <div className="text-[10px] text-green-500/70">GPS LAT: {country.lat.toFixed(4)}° | LNG: {country.lng.toFixed(4)}°</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500">ACCURACY RANK</div>
            <div className="text-2xl font-black text-amber-400">{rank}-RANK</div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          
          <div className="bg-zinc-950 border border-green-900/60 p-3 rounded text-center">
            <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
              <Target className="w-3.5 h-3.5 text-green-400" /> TOTAL SHOTS FIRED
            </div>
            <div className="text-2xl font-bold text-green-300 mt-1">{stats.shotsFired}</div>
          </div>

          <div className="bg-zinc-950 border border-green-900/60 p-3 rounded text-center">
            <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
              <Percent className="w-3.5 h-3.5 text-cyan-400" /> HIT ACCURACY
            </div>
            <div className="text-2xl font-bold text-cyan-300 mt-1">{accuracy}%</div>
          </div>

          <div className="bg-zinc-950 border border-green-900/60 p-3 rounded text-center">
            <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-green-400" /> INTERCEPTED KILLS
            </div>
            <div className="text-2xl font-bold text-green-400 mt-1">{stats.intercepted}</div>
          </div>

          <div className="bg-zinc-950 border border-green-900/60 p-3 rounded text-center">
            <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-red-400" /> IMPACTS SUSTAINED
            </div>
            <div className="text-2xl font-bold text-red-400 mt-1">{stats.impacts}</div>
          </div>

        </div>

        {/* Shots Breakdown: Manual vs Auto */}
        <div className="bg-green-950/30 border border-green-800/40 p-4 rounded-lg space-y-3 mb-5 text-xs">
          <div className="font-bold text-green-300 uppercase tracking-wider mb-1">FIRE MODE BREAKDOWN</div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5"><Crosshair className="w-3.5 h-3.5 text-green-400" /> Manual Shots Fired</span>
              <span className="font-bold text-green-300">{stats.manualShots}</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${stats.shotsFired > 0 ? (stats.manualShots / stats.shotsFired) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-cyan-400" /> Auto AI Shots Fired</span>
              <span className="font-bold text-cyan-300">{stats.autoShots}</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all"
                style={{ width: `${stats.shotsFired > 0 ? (stats.autoShots / stats.shotsFired) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded text-xs tracking-wider transition-all uppercase cursor-pointer"
        >
          CLOSE TELEMETRY DASHBOARD
        </button>
      </div>
    </div>
  );
};
