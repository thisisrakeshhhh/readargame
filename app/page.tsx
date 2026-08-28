'use client';

import React, { useState } from 'react';
import { Country, DefenseMode, Difficulty, PrivacyPreferences } from '../types/game';
import { CountrySetup } from '../components/CountrySetup';
import { TacticalCommand } from '../components/TacticalCommand';
import { CookieBanner } from '../components/CookieBanner';

export default function Home() {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [activeConfig, setActiveConfig] = useState<{
    country: Country;
    mode: DefenseMode;
    difficulty: Difficulty;
  } | null>(null);

  const [privacyPrefs, setPrivacyPrefs] = useState<Partial<PrivacyPreferences>>({
    cookieConsentGiven: false,
    analyticsEnabled: true,
    adsEnabled: true,
  });

  const handleStartGame = (config: {
    country: Country;
    mode: DefenseMode;
    difficulty: Difficulty;
  }) => {
    setActiveConfig(config);
    setGameState('playing');
  };

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono">
      {/* Cookie Consent Banner */}
      <CookieBanner
        onSavePreferences={(prefs) => setPrivacyPrefs((prev) => ({ ...prev, ...prefs }))}
      />

      {gameState === 'setup' || !activeConfig ? (
        <CountrySetup onStartGame={handleStartGame} />
      ) : (
        <TacticalCommand
          country={activeConfig.country}
          initialMode={activeConfig.mode}
          onExitToSetup={() => setGameState('setup')}
        />
      )}
    </main>
  );
}
