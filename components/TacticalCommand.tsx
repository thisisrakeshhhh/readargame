'use client';

import React, { useState } from 'react';
import { Country, DefenseMode, GameStats, ScreenView, Interceptor } from '../types/game';
import { HudOverlay } from './HudOverlay';
import { RadarCanvas } from './RadarCanvas';
import { AttackScreen } from './AttackScreen';
import { ManualFlightController } from './ManualFlightController';
import { AdSenseSlot } from './AdSenseSlot';
import { audioEngine } from './AudioEngine';

interface TacticalCommandProps {
  country: Country;
  initialMode: DefenseMode;
  onExitToSetup: () => void;
}

export const TacticalCommand: React.FC<TacticalCommandProps> = ({
  country,
  initialMode,
  onExitToSetup,
}) => {
  const [defenseMode, setDefenseMode] = useState<DefenseMode>(initialMode);
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('defense');
  const [isMuted, setIsMuted] = useState(false);

  const [stats, setStats] = useState<GameStats>({
    intercepted: 0,
    impacts: 0,
    shotsFired: 0,
    manualShots: 0,
    autoShots: 0,
    score: 0,
    integrity: 100,
    ammo: country.maxAmmo,
    maxAmmo: country.maxAmmo,
    threatLevel: 'MED',
    wave: 1,
  });

  const [activeManualInterceptor, setActiveManualInterceptor] = useState<Interceptor | null>(null);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  const handleToggleDefenseMode = () => {
    setDefenseMode((prev) => (prev === 'manual' ? 'auto' : 'manual'));
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col justify-between relative overflow-hidden">
      {/* Background CRT scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />

      {/* Top Telemetry Header */}
      <HudOverlay
        country={country}
        defenseMode={defenseMode}
        currentScreen={currentScreen}
        stats={stats}
        isMuted={isMuted}
        onToggleDefenseMode={handleToggleDefenseMode}
        onSwitchScreen={setCurrentScreen}
        onToggleMute={handleToggleMute}
      />

      {/* Main View Display */}
      <div className="flex-1 flex items-center justify-center p-4 z-20">
        {currentScreen === 'defense' ? (
          <div className="flex flex-col items-center">
            <RadarCanvas
              country={country}
              defenseMode={defenseMode}
              stats={stats}
              onUpdateStats={setStats}
              onSelectInterceptorForManualPilot={setActiveManualInterceptor}
            />
          </div>
        ) : (
          <div className="w-full">
            <AttackScreen
              country={country}
              stats={stats}
              onUpdateStats={setStats}
            />
          </div>
        )}
      </div>

      {/* Manual Joystick Flight Controller floating UI */}
      {activeManualInterceptor && (
        <ManualFlightController
          activeMissile={activeManualInterceptor}
          onUpdateSteering={(vx, vy) => {
            setActiveManualInterceptor((prev) =>
              prev ? { ...prev, manualVelocity: { vx, vy }, isManualControlled: true } : null
            );
          }}
          onDetonate={() => setActiveManualInterceptor(null)}
          onClose={() => setActiveManualInterceptor(null)}
        />
      )}

      {/* Footer with AdSense Ad Unit & Back Button */}
      <div className="z-30 px-4 py-2 border-t border-green-950 bg-black/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <button
          onClick={onExitToSetup}
          className="text-xs text-green-500/70 hover:text-green-300 underline font-mono cursor-pointer"
        >
          ← ABORT TO COUNTRY SELECTION
        </button>

        {/* AdSense Slot */}
        <div className="w-full md:max-w-xl">
          <AdSenseSlot format="auto" />
        </div>

        <div className="text-[10px] text-zinc-600 font-mono">
          READAR SIMULATOR v2.4 | ALL SYSTEMS OPERATIONAL
        </div>
      </div>
    </div>
  );
};
