import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, CheckSquare, AlertTriangle } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Readar Tactical Radar Simulation',
  description: 'Terms and Conditions of Use for the Readar tactical defense simulation web platform.',
};

export default function TermsPage() {
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
          <span className="text-xs text-emerald-600 font-bold tracking-widest uppercase">TERMS OF USE</span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Scale className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider">TERMS OF SERVICE</h1>
          </div>
          <p className="text-xs text-zinc-500">Effective Date: August 28, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-zinc-400">
          
          <section className="space-y-2 p-4 rounded-xl bg-zinc-950 border border-emerald-950">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the <strong>Readar Tactical Simulation</strong> application, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue use of the application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">2. Description of Service & Educational Purpose</h2>
            <p>
              Readar is an interactive, browser-based tactical defense game and radar visualization tool. All simulations, target contacts, defense weapons, trajectory mathematics, and interceptor calculations are purely fictional and created solely for entertainment and educational demonstration of radar physics.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">3. Intellectual Property Rights</h2>
            <p>
              All software, algorithms, Canvas rendering engines, UI designs, graphics, audio synthesis components, and codebase of Readar are protected by intellectual property laws and copyright. You may not reverse-engineer, redistribute, or replicate the platform without prior written consent.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">4. Third-Party Advertisements & Links</h2>
            <p>
              Readar displays third-party advertisements served through Google AdSense. We do not endorse or assume responsibility for any third-party content, products, or services advertised on our platform. Interacting with third-party advertisements is at your own discretion.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">5. Disclaimer of Warranties & Limitation of Liability</h2>
            <p>
              The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. Readar disclaims all warranties, whether express or implied, including fitness for a particular purpose or non-infringement.
            </p>
          </section>

          <section className="space-y-2 border-t border-emerald-950 pt-4">
            <h2 className="text-sm sm:text-base font-bold text-emerald-300">6. Modifications to Terms</h2>
            <p>
              We reserve the right to modify or replace these terms at any time. Continued use of the service following any revisions constitutes your acceptance of the revised terms.
            </p>
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
