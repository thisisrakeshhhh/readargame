import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Target, Crosshair, Radio, Shield, Zap } from 'lucide-react';
import { Metadata } from 'next';
import { AdSenseSlot } from '../../components/AdSenseSlot';

export const metadata: Metadata = {
  title: 'How to Play - Readar Tactical Radar Game',
  description: 'Learn the controls, scanning mechanics, threat types, and interceptor defense tactics in ReadarGame.',
};

export default function HowToPlayPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-300 font-mono p-4 sm:p-8 md:p-12 flex justify-center selection:bg-emerald-500 selection:text-black">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-emerald-900 hover:border-emerald-500 text-emerald-400 hover:text-emerald-200 text-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> RETURN TO RADAR
          </Link>
          <span className="text-xs text-emerald-600 font-bold tracking-widest uppercase">PLAYER GUIDE</span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Gamepad2 className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider">HOW TO PLAY READARGAME</h1>
          </div>
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">
            TACTICAL CONTROLS, RADAR SWEEPS & DEFENSE MECHANICS
          </p>
        </div>

        {/* Fictional Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-950 text-xs text-zinc-400 leading-relaxed">
          <strong className="text-emerald-300">🎮 FICTIONAL GAME NOTICE:</strong> ReadarGame is a fictional browser-based arcade radar game designed for entertainment and educational demonstration of radar physics. All locations, units, and scenarios are entirely simulated and fictional.
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-zinc-400">
          
          {/* Step 1: Scan First */}
          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" /> 1. First Scan, Then Strike
            </h2>
            <p>
              Incoming objects first appear at the radar edge as amber unconfirmed blips (<span className="text-amber-400">● UNK</span>). As the rotating radar sweep beam passes over them, their threat category is identified and they lock onto the tactical grid with an active callsign (e.g. <span className="text-red-400">MSL-42</span>).
            </p>
          </section>

          {/* Step 2: Controls */}
          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-400" /> 2. Firing Interceptors
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-300 text-xs">
              <li><strong>Desktop:</strong> Tap any target on screen to view its HP armor, and press <code>Spacebar</code> (or click <span className="text-red-400 font-bold">[ STRIKE ]</span>) to launch an interceptor.</li>
              <li><strong>Mobile / Tablet:</strong> Tap any moving contact with your thumb, then tap the floating red <span className="text-red-400 font-bold">[ 🚀 FIRE ]</span> button in the bottom right corner.</li>
              <li><strong>Auto Defense:</strong> Toggle <span className="text-cyan-400 font-bold">[ AUTO: ON ]</span> to let the automated defense AI engage confirmed hostiles based on base proximity.</li>
            </ul>
          </section>

          {/* Step 3: Target HP & Wreckage */}
          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> 3. Armor Ratings & Red &quot;X&quot; Crash Sites
            </h2>
            <p>
              Standard units require 1 hit, while heavy bombers and hypersonic craft require multiple hits. Titan Boss Carriers have 4 HP armor bars. Once destroyed, a persistent red <span className="text-red-400 font-bold">×</span> wreckage marker stays on the map for 14 seconds to mark your victory.
            </p>
          </section>

          {/* AdSense Unit */}
          <AdSenseSlot slotId="3456789012" format="auto" />

        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-emerald-950 text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} ReadarGame. All rights reserved. Fictional radar simulation.
        </div>

      </div>
    </main>
  );
}
