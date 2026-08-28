'use client';

import React, { useState } from 'react';
import { Country, GameStats } from '../types/game';
import { Crosshair, ShieldAlert, Rocket, Plane, Target, Flame, CheckCircle2 } from 'lucide-react';
import { audioEngine } from './AudioEngine';

interface AttackScreenProps {
  country: Country;
  stats: GameStats;
  onUpdateStats: (updater: (prev: GameStats) => GameStats) => void;
}

interface EnemyBase {
  id: string;
  name: string;
  location: string;
  type: 'missile_silo' | 'naval_base' | 'airfield';
  health: number;
  maxHealth: number;
  threatOutput: string;
  destroyed: boolean;
}

export const AttackScreen: React.FC<AttackScreenProps> = ({ country, stats, onUpdateStats }) => {
  const [enemyBases, setEnemyBases] = useState<EnemyBase[]>([
    { id: 'base-1', name: 'Red Star Missile Base Alpha', location: 'Northern Sector (Grid 44-B)', type: 'missile_silo', health: 100, maxHealth: 100, threatOutput: 'Ballistic & Hypersonic Missiles', destroyed: false },
    { id: 'base-2', name: 'Kirov Naval Shipyard', location: 'Maritime Channel (Grid 12-F)', type: 'naval_base', health: 100, maxHealth: 100, threatOutput: 'Submarine Launched Cruise Missiles', destroyed: false },
    { id: 'base-3', name: 'Vanguard Airfield', location: 'Eastern Frontier (Grid 88-C)', type: 'airfield', health: 100, maxHealth: 100, threatOutput: 'Stealth Bombers & Fighter Jets', destroyed: false },
  ]);

  const [selectedBase, setSelectedBase] = useState<EnemyBase | null>(enemyBases[0]);
  const [strikeCooldown, setStrikeCooldown] = useState(false);

  const handleExecuteStrike = (weaponType: 'cruise' | 'airstrike' | 'icbm') => {
    if (!selectedBase || selectedBase.destroyed || strikeCooldown) return;

    setStrikeCooldown(true);
    audioEngine.playMissileLaunch();

    let damage = 40;
    if (weaponType === 'airstrike') damage = 60;
    if (weaponType === 'icbm') damage = 100;

    setTimeout(() => {
      audioEngine.playExplosion();

      const newHealth = Math.max(0, selectedBase.health - damage);
      const isDestroyed = newHealth === 0;

      if (isDestroyed && !selectedBase.destroyed) {
        onUpdateStats((prev) => ({
          ...prev,
          score: prev.score + 1000,
        }));
      }

      setEnemyBases((prevBases) =>
        prevBases.map((b) => (b.id === selectedBase.id ? { ...b, health: newHealth, destroyed: isDestroyed } : b))
      );

      setStrikeCooldown(false);
    }, 1500);
  };

  return (
    <div className="bg-black/90 border border-red-500/40 p-6 rounded-lg text-red-400 font-mono shadow-[0_0_25px_rgba(239,68,68,0.15)] max-w-5xl mx-auto">
      {/* Screen Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-red-900/60">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-red-300">COUNTER-STRIKE TACTICAL COMMAND</h2>
            <p className="text-xs text-red-400/70">NEUTRALIZE ENEMY LAUNCH BASES TO REDUCE RADAR THREAT SPONS</p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-zinc-500">OPERATIONAL SCORE</div>
          <div className="text-xl font-bold text-amber-400">{stats.score} PTS</div>
        </div>
      </div>

      {/* Main Strategic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Enemy Launch Platforms List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-400" /> IDENTIFIED ENEMY TARGETS
          </h3>

          {enemyBases.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBase(b)}
              className={`p-4 rounded border cursor-pointer transition-all ${
                selectedBase?.id === b.id
                  ? 'bg-red-950/80 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                  : 'bg-zinc-950/60 border-red-950 hover:border-red-800 text-red-400/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{b.name}</span>
                {b.destroyed ? (
                  <span className="flex items-center gap-1 text-xs text-green-400 font-bold bg-green-950 px-2 py-0.5 rounded border border-green-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> DESTROYED
                  </span>
                ) : (
                  <span className="text-xs text-red-400 font-bold">{b.health}/{b.maxHealth} HP</span>
                )}
              </div>

              <div className="text-[11px] text-red-400/70 mb-2">
                Location: {b.location} | Threat: {b.threatOutput}
              </div>

              {/* Health Bar */}
              <div className="w-full bg-zinc-900 h-1.5 rounded overflow-hidden">
                <div
                  className={`h-full transition-all ${b.destroyed ? 'bg-zinc-700' : 'bg-red-500'}`}
                  style={{ width: `${(b.health / b.maxHealth) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Selected Target Strike Control */}
        <div className="bg-red-950/20 border border-red-900/60 p-5 rounded-lg flex flex-col justify-between">
          {selectedBase ? (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-red-900/40 pb-2">
                <span className="font-bold text-sm text-red-300">TARGET ACQUIRED: {selectedBase.name}</span>
                <Flame className="w-5 h-5 text-red-500 animate-bounce" />
              </div>

              <p className="text-xs text-red-300/80 mb-6 leading-relaxed">
                Select an offensive strike package to launch against {selectedBase.name}. Successful strikes permanently destroy threat output channels.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleExecuteStrike('cruise')}
                  disabled={selectedBase.destroyed || strikeCooldown}
                  className="w-full bg-red-950 border border-red-600 hover:bg-red-600 hover:text-black text-red-300 font-bold py-3 px-4 rounded text-xs flex items-center justify-between transition-all disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <Rocket className="w-4 h-4" /> NAVAL CRUISE MISSILE SALVO
                  </span>
                  <span>40 DMG</span>
                </button>

                <button
                  onClick={() => handleExecuteStrike('airstrike')}
                  disabled={selectedBase.destroyed || strikeCooldown}
                  className="w-full bg-red-950 border border-red-600 hover:bg-red-600 hover:text-black text-red-300 font-bold py-3 px-4 rounded text-xs flex items-center justify-between transition-all disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <Plane className="w-4 h-4" /> CARRIER STEALTH BOMBER STRIKE
                  </span>
                  <span>60 DMG</span>
                </button>

                <button
                  onClick={() => handleExecuteStrike('icbm')}
                  disabled={selectedBase.destroyed || strikeCooldown}
                  className="w-full bg-red-600 hover:bg-red-500 text-black font-black py-3 px-4 rounded text-xs flex items-center justify-between transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                >
                  <span className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4" /> GROUND ICBM PRECISION STRIKE
                  </span>
                  <span>100 DMG</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-zinc-500 my-auto">
              SELECT AN ENEMY TARGET FROM THE LEFT PANEL TO AUTHORIZE STRIKE
            </div>
          )}

          {strikeCooldown && (
            <div className="mt-4 text-center text-xs text-amber-400 font-bold animate-pulse">
              🚀 LAUNCHING OFFENSIVE STRIKE... STAND BY FOR BOMB DAMAGE ASSESSMENT
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
