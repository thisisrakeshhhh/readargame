'use client';

import React from 'react';
import { SimpleRadarGame } from '../components/SimpleRadarGame';
import { CookieBanner } from '../components/CookieBanner';

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black font-mono">
      <CookieBanner onSavePreferences={() => {}} />
      <SimpleRadarGame />
    </div>
  );
}
