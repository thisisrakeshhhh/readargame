'use client';

import React from 'react';
import { GameEngine3D } from '../components/GameEngine3D';
import { CookieBanner } from '../components/CookieBanner';

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black font-mono">
      <CookieBanner onSavePreferences={() => {}} />
      <GameEngine3D />
    </div>
  );
}
