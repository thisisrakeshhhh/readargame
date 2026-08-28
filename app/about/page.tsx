import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Radio, Cpu, Globe, Target, ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - Readar Tactical Radar Simulation',
  description: 'Learn about Readar, an interactive retro-futuristic tactical radar and aerospace defense simulator.',
};

export default function AboutPage() {
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
          <span className="text-xs text-emerald-600 font-bold tracking-widest uppercase">ABOUT THE PLATFORM</span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider">ABOUT READAR</h1>
          </div>
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">
            ADVANCED BROWSER-BASED TACTICAL AIRSPACE SIMULATION
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-zinc-400">
          
          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Mission & Vision
            </h2>
            <p>
              <strong>Readar</strong> was developed to deliver an authentic, high-speed tactical command center simulation directly inside modern web browsers without requiring hefty downloads or external game plugins.
            </p>
            <p>
              Combining real-world GIS geographic mapping with pure 60 FPS HTML5 Canvas math rendering, Readar bridges the gap between retro military CRT radar consoles and modern aerospace defense command interfaces.
            </p>
          </section>

          <section className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-950 space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" /> Real Geographic Cartography
              </h3>
              <p className="text-xs text-zinc-500">
                Overlaying live tactical radar grids over actual geographic coordinates worldwide, allowing defense operations across Washington, London, Tokyo, Berlin, Kyiv, and custom GPS coordinates.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-950 space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-500" /> 60 FPS Delta-Time Engine
              </h3>
              <p className="text-xs text-zinc-500">
                Driven by continuous delta-time physics, high-velocity trajectory calculations, automated multi-target AI interception, and armor health systems.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> Aerospace Physics & Sound Synthesis
            </h2>
            <p>
              Audio is synthesized entirely in real-time through the Web Audio API using mathematical sine and saw oscillators, recreating the acoustic soundscapes of active phased-array radar sweeps, sonar pings, hypersonic sonic booms, and proximity detonations.
            </p>
          </section>

          <section className="space-y-2 border-t border-emerald-950 pt-4">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">Technical Specifications</h2>
            <ul className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
              <li className="p-2 rounded bg-zinc-950 border border-emerald-950">Engine: HTML5 Canvas 2D</li>
              <li className="p-2 rounded bg-zinc-950 border border-emerald-950">Mapping: Leaflet Dark Tiles</li>
              <li className="p-2 rounded bg-zinc-950 border border-emerald-950">Audio: Web Audio API Oscillator</li>
              <li className="p-2 rounded bg-zinc-950 border border-emerald-950">Framework: Next.js 16 (Turbopack)</li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-emerald-950 text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Readar Tactical Operations. All rights reserved.
        </div>

      </div>
    </main>
  );
}
