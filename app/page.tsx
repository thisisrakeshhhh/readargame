'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const SimpleRadarGame = dynamic(
  () => import('../components/SimpleRadarGame').then((mod) => mod.SimpleRadarGame),
  { ssr: false }
);

const CookieBanner = dynamic(
  () => import('../components/CookieBanner').then((mod) => mod.CookieBanner),
  { ssr: false }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center font-mono text-emerald-400">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span className="text-xs font-bold tracking-widest uppercase">INITIALIZING RADAR SYSTEM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black font-mono">
      <CookieBanner onSavePreferences={() => {}} />
      <SimpleRadarGame />
    </div>
  );
}
