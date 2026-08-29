import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Target, Radio, Shield, Crosshair, Zap, Cpu } from 'lucide-react';
import { Metadata } from 'next';
import { AdSenseSlot } from '../../components/AdSenseSlot';

export const metadata: Metadata = {
  title: 'Tactical Field Manual & Radar Guide - Readar',
  description: 'Comprehensive operator manual for airspace surveillance, radar frequency physics, threat classification, and missile defense strategies.',
};

export default function TacticalGuidePage() {
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
          <span className="text-xs text-emerald-600 font-bold tracking-widest uppercase">TACTICAL MANUAL</span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <BookOpen className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider">AIR DEFENSE FIELD MANUAL</h1>
          </div>
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">
            OPERATOR PROCEDURES, RADAR PHYSICS & THREAT ENGAGEMENT
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-zinc-400">
          
          {/* Section 1 */}
          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" /> 1. Principles of Radar Detection & Sweep Geometry
            </h2>
            <p>
              Primary Surveillance Radar (PSR) operates on the principle of transmitting pulses of high-frequency radio waves and measuring the reflected echo from metallic airframes. In <strong>Readar</strong>, the rotating beam simulates a continuous 360-degree azimuthal sweep.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400 text-xs">
              <li><strong>Unscanned Ingress:</strong> Contacts entering the sector appear as faint unconfirmed blips (<span className="text-amber-400">● UNK</span>).</li>
              <li><strong>Sweep Crossing:</strong> When the beam crosses a target, Doppler return echoes classify the threat, locking its trajectory and revealing its callsign.</li>
              <li><strong>Range Rings:</strong> Concentric circles represent radar range intervals at 50km, 100km, 250km, and 500km scales.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> 2. Threat Classification & Armor Ratings
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black/60 border border-emerald-950 space-y-1">
                <span className="text-red-400 font-bold">▲ MISSILE (MSL)</span>
                <p className="text-zinc-500">Speed: 52 px/s (Mach 4+) | Armor: 1 HP. Direct kinetic threat targeting central command.</p>
              </div>
              <div className="p-3 rounded-lg bg-black/60 border border-emerald-950 space-y-1">
                <span className="text-red-400 font-bold">⇈ HYPERSONIC (HYPER)</span>
                <p className="text-zinc-500">Speed: 62 px/s (Mach 8+) | Armor: 2 HP. Ultra-fast glide vehicle with multi-hit armor.</p>
              </div>
              <div className="p-3 rounded-lg bg-black/60 border border-emerald-950 space-y-1">
                <span className="text-red-400 font-bold">✈ FIGHTER JET (JET)</span>
                <p className="text-zinc-500">Speed: 42 px/s (Mach 2+) | Armor: 1 HP. High maneuverability attack aircraft.</p>
              </div>
              <div className="p-3 rounded-lg bg-black/60 border border-emerald-950 space-y-1">
                <span className="text-rose-400 font-bold">⬡ BOSS CARRIER (TITAN)</span>
                <p className="text-zinc-500">Speed: 13 px/s | Armor: 4 HP. Heavy dreadnought launching continuous rocket volleys.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> 3. Defense Tactics & Controls
            </h2>
            <div className="space-y-2 text-xs">
              <p>
                <strong>Automated Defense (AUTO: ON):</strong> The autonomous fire-control AI continuously evaluates scanned hostiles and launches interceptors based on proximity to base.
              </p>
              <p>
                <strong>Manual Strike (AUTO: OFF / SPACEBAR):</strong> Operators can click any contact on screen or tap the on-screen <span className="text-red-400 font-bold">[ STRIKE / FIRE ]</span> trigger (or press <code>Spacebar</code> on keyboard) to fire interceptors manually.
              </p>
            </div>
          </section>

          {/* AdSense Unit */}
          <AdSenseSlot slotId="1234567890" format="auto" />

        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-emerald-950 text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Readar Tactical Operations. All rights reserved.
        </div>

      </div>
    </main>
  );
}
