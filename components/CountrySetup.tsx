'use client';

import React, { useState } from 'react';
import { Country, DefenseMode, Difficulty } from '../types/game';
import { COUNTRIES_DATA } from '../utils/mapData';
import { LocationPrompt } from './LocationPrompt';
import { Terminal, Shield, Radio, Crosshair, Cpu, Anchor, Plane, Building2, Zap, Flame, Sparkles, Navigation, MapPin } from 'lucide-react';

interface CountrySetupProps {
  onStartGame: (config: {
    country: Country;
    mode: DefenseMode;
    difficulty: Difficulty;
  }) => void;
}

export const CountrySetup: React.FC<CountrySetupProps> = ({ onStartGame }) => {
  const [tab, setTab] = useState<'beginner' | 'custom'>('beginner');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES_DATA[0]);
  const [defenseMode, setDefenseMode] = useState<DefenseMode>('auto');
  const [difficulty, setDifficulty] = useState<Difficulty>('rookie');
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [gpsDetected, setGpsDetected] = useState(false);

  const handleQuickStart = () => {
    onStartGame({
      country: selectedCountry,
      mode: 'auto',
      difficulty: 'rookie',
    });
  };

  const handleLocationDetected = (coords: { lat: number; lng: number }, matched: Country) => {
    setSelectedCountry({
      ...matched,
      lat: coords.lat,
      lng: coords.lng,
      name: `${matched.name} (Realtime GPS)`,
    });
    setGpsDetected(true);
    setShowLocationPrompt(false);
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Matrix Scanlines Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />

      {/* Cyberpunk Hacker Glow Banner Header */}
      <div className="text-center mb-6 max-w-3xl z-20">
        <div className="inline-flex items-center gap-2 bg-green-950/80 border border-green-500/50 px-3 py-1 rounded-full text-xs mb-3 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          <Terminal className="w-4 h-4 text-green-400 animate-pulse" />
          <span>CYBER TACTICAL COMMAND TERMINAL v2.4</span>
        </div>

        <h1 className="text-3xl md:text-6xl font-black tracking-widest uppercase text-shadow-glow text-green-400 mb-2">
          READAR DEFENSE
        </h1>
        <p className="text-xs md:text-sm text-green-400/80 tracking-wider font-mono">
          [ ACCESS GRANTED ] EARLY WARNING MISSILE RADAR & DEFENSE NETWORK
        </p>
      </div>

      <div className="w-full max-w-4xl z-20 space-y-6">
        
        {/* Geolocation Prompt */}
        {showLocationPrompt && (
          <LocationPrompt
            onLocationDetected={handleLocationDetected}
            onSkip={() => setShowLocationPrompt(false)}
          />
        )}

        {/* Realtime GPS Lock Banner if detected */}
        {gpsDetected && (
          <div className="bg-cyan-950/60 border border-cyan-500/60 p-3 rounded-lg flex items-center justify-between text-xs text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span>REALTIME GPS ACQUIRED: <strong className="text-white">{selectedCountry.lat.toFixed(4)}°N, {selectedCountry.lng.toFixed(4)}°E</strong></span>
            </div>
            <span className="bg-cyan-900 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-cyan-200">LOCATION LOCKED</span>
          </div>
        )}

        {/* Tab Switcher: Beginner Quick Start vs Custom Configuration */}
        <div className="flex justify-center gap-4 border-b border-green-800/60 pb-3">
          <button
            onClick={() => setTab('beginner')}
            className={`py-2.5 px-6 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              tab === 'beginner'
                ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105'
                : 'bg-green-950/60 border border-green-800/60 text-green-400 hover:bg-green-900'
            }`}
          >
            <Zap className="w-4 h-4" /> ⚡ BEGINNER QUICK PLAY (1-CLICK)
          </button>

          <button
            onClick={() => setTab('custom')}
            className={`py-2.5 px-6 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              tab === 'custom'
                ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105'
                : 'bg-green-950/60 border border-green-800/60 text-green-400 hover:bg-green-900'
            }`}
          >
            <Shield className="w-4 h-4" /> ⚙️ ADVANCED WAR ROOM
          </button>
        </div>

        {/* BEGINNER TAB: Simple 1-Click Hacker Interface */}
        {tab === 'beginner' ? (
          <div className="bg-black/90 border-2 border-green-500/60 p-6 md:p-8 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.25)] text-center space-y-6">
            
            <div className="bg-green-950/40 border border-green-800/60 p-4 rounded-lg text-left text-xs font-mono space-y-2">
              <div className="text-green-300 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-400 animate-spin-slow" />
                <span>BEGINNER MODE COMMAND INSTRUCTIONS:</span>
              </div>
              <p className="text-green-400/80">
                1. Click the giant <strong className="text-green-300">LAUNCH RADAR</strong> button below.
              </p>
              <p className="text-green-400/80">
                2. Your <strong className="text-cyan-300">Automatic Iron Dome AI</strong> will instantly start scanning and shooting down enemy missiles!
              </p>
              <p className="text-green-400/80">
                3. Want to manual shoot? Click anywhere on the green radar grid to fire guided interceptor missiles!
              </p>
            </div>

            {/* Selected Country Badge */}
            <div className="flex items-center justify-center gap-4 bg-zinc-950 border border-green-800/60 p-4 rounded-lg">
              <span className="text-4xl">{selectedCountry.flag}</span>
              <div className="text-left">
                <div className="font-bold text-lg text-green-300">{selectedCountry.name} DEFENSE GRID</div>
                <div className="text-xs text-green-500/70">{selectedCountry.description}</div>
              </div>
            </div>

            {/* Giant Instant Play Button */}
            <button
              onClick={handleQuickStart}
              className="w-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 hover:from-green-400 hover:to-emerald-300 text-black font-black py-5 px-8 rounded-xl text-lg md:text-xl tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all transform hover:scale-[1.02] cursor-pointer uppercase"
            >
              <Zap className="w-7 h-7 fill-black animate-bounce" />
              LAUNCH RADAR GAME NOW
            </button>
          </div>
        ) : (
          /* CUSTOM ADVANCED WAR ROOM TAB */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Country Selection */}
            <div className="bg-black/80 border border-green-500/40 p-5 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-800/60 text-green-300">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h2 className="font-bold text-sm uppercase tracking-wider">1. OPERATIONAL THEATER</h2>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {COUNTRIES_DATA.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCountry(c);
                        setGpsDetected(false);
                      }}
                      className={`w-full text-left p-3 rounded flex items-center justify-between border transition-all text-xs cursor-pointer ${
                        selectedCountry.id === c.id
                          ? 'bg-green-950/80 border-green-400 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.25)]'
                          : 'bg-zinc-950/60 border-green-950/80 hover:border-green-700/50 text-green-500/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{c.flag}</span>
                        <div>
                          <div className="font-bold">{c.name}</div>
                          <div className="text-[10px] text-green-500/60">Range: {c.radarRadius} km</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Protocol & Mode */}
            <div className="bg-black/80 border border-green-500/40 p-5 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-800/60 text-green-300">
                  <Cpu className="w-5 h-5 text-green-400" />
                  <h2 className="font-bold text-sm uppercase tracking-wider">2. PROTOCOL & MODE</h2>
                </div>

                <div className="mb-6 space-y-2">
                  <label className="block text-xs font-semibold text-green-400 uppercase">
                    INTERCEPTION CONTROL
                  </label>
                  <button
                    onClick={() => setDefenseMode('auto')}
                    className={`w-full p-3 rounded border text-xs text-left flex items-center gap-3 transition-all cursor-pointer ${
                      defenseMode === 'auto'
                        ? 'bg-green-950 border-green-400 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="font-bold">AUTOMATIC AI (RECOMMENDED)</div>
                      <div className="text-[9px] text-green-400/60">Iron Dome Auto-Interception</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setDefenseMode('manual')}
                    className={`w-full p-3 rounded border text-xs text-left flex items-center gap-3 transition-all cursor-pointer ${
                      defenseMode === 'manual'
                        ? 'bg-green-950 border-green-400 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <Crosshair className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="font-bold">MANUAL CLICK CONTROL</div>
                      <div className="text-[9px] text-green-400/60">Click Radar / WASD Missile Steer</div>
                    </div>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-green-400 mb-2 uppercase">
                    THREAT INTENSITY
                  </label>
                  <div className="space-y-2">
                    {(['rookie', 'veteran', 'commander'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`w-full text-left p-2 rounded border text-xs uppercase flex items-center justify-between transition-all cursor-pointer ${
                          difficulty === d
                            ? 'bg-green-950 border-green-400 text-green-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <span className="font-bold">{d}</span>
                        <Flame className={`w-4 h-4 ${difficulty === d ? 'text-amber-400' : 'text-zinc-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Launch */}
            <div className="bg-black/80 border border-green-500/40 p-5 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-800/60 text-green-300">
                  <Anchor className="w-5 h-5 text-green-400" />
                  <h2 className="font-bold text-sm uppercase tracking-wider">3. ASSET SUMMARY</h2>
                </div>

                <div className="bg-green-950/30 border border-green-800/40 p-3 rounded mb-4 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <span className="font-bold text-green-300 text-sm">{selectedCountry.name}</span>
                  </div>
                  <p className="text-[11px] text-green-400/80 mb-3">{selectedCountry.description}</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-t border-green-900/60 pt-2 text-green-400">
                    <div className="flex flex-col items-center">
                      <Building2 className="w-4 h-4 text-green-400 mb-1" />
                      <span>{selectedCountry.startingSilos} SILOS</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Anchor className="w-4 h-4 text-cyan-400 mb-1" />
                      <span>{selectedCountry.startingShips} NAVY</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Plane className="w-4 h-4 text-amber-400 mb-1" />
                      <span>{selectedCountry.startingJets} JETS</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onStartGame({ country: selectedCountry, mode: defenseMode, difficulty })}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded text-sm tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all uppercase cursor-pointer"
              >
                <Radio className="w-5 h-5 fill-black" />
                INITIATE COMMAND
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
