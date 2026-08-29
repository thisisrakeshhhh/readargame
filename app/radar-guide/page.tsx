import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Radio, Cpu, Compass, Activity, BookOpen, Layers } from 'lucide-react';
import { Metadata } from 'next';
import { AdSenseSlot } from '../../components/AdSenseSlot';

export const metadata: Metadata = {
  title: 'Radar Science & Technology Guide - ReadarGame',
  description: 'An educational guide explaining radio detection and ranging (RADAR), Doppler effect, phased arrays, and azimuth scanning principles.',
};

export default function RadarGuidePage() {
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
          <span className="text-xs text-emerald-600 font-bold tracking-widest uppercase">EDUCATIONAL GUIDE</span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider">RADAR SCIENCE & TECHNOLOGY</h1>
          </div>
          <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">
            AN OPERATOR&apos;S GUIDE TO RADIO DETECTION AND RANGING
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-zinc-400">
          
          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> 1. How Radar Works: Time-of-Flight & Reflections
            </h2>
            <p>
              RADAR stands for <strong>Radio Detection and Ranging</strong>. It functions by emitting high-frequency electromagnetic pulses at the speed of light (approximately 300,000 km/s). When these radio waves encounter a metallic airframe or surface, a fraction of the energy is reflected back to the receiver antenna.
            </p>
            <p className="text-zinc-300">
              The target distance R is calculated using the speed of light c and round-trip delay time Δt:
            </p>
            <div className="p-3 rounded-lg bg-black/80 border border-emerald-950 font-mono text-emerald-400 text-center font-bold text-sm tracking-wider">
              Distance (R) = (c × Δt) / 2
            </div>
          </section>

          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" /> 2. Azimuth Sweeps & Plan Position Indicators (PPI)
            </h2>
            <p>
              The classic circular radar screen recreated in ReadarGame is known as a <strong>Plan Position Indicator (PPI)</strong>. As the directional antenna rotates through 360 degrees of azimuth, return echoes are mapped in polar coordinates (\(r, \theta\)), translating them into distance and bearing from the central station.
            </p>
          </section>

          <section className="space-y-3 p-5 rounded-2xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> 3. Modern Active Electronically Scanned Arrays (AESA)
            </h2>
            <p>
              While mechanical dishes spin continuously, modern <strong>AESA phased arrays</strong> steer electromagnetic beams electronically in microseconds without physical moving parts. This enables simultaneous multi-target tracking, missile guidance, and electronic counter-countermeasures.
            </p>
          </section>

          {/* AdSense Unit */}
          <AdSenseSlot slotId="4567890123" format="auto" />

        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-emerald-950 text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} ReadarGame. All rights reserved. Educational aerospace simulation.
        </div>

      </div>
    </main>
  );
}
