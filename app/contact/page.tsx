'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      setIsSubmitted(true);
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-300 font-mono p-4 sm:p-8 md:p-12 flex justify-center selection:bg-emerald-500 selection:text-black">
      <div className="max-w-xl w-full space-y-8">
        
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-emerald-900 hover:border-emerald-500 text-emerald-400 hover:text-emerald-200 text-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> RETURN TO RADAR
          </Link>
          <span className="text-xs text-emerald-600 font-bold tracking-widest uppercase">COMMUNICATIONS</span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Mail className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider">CONTACT & SUPPORT</h1>
          </div>
          <p className="text-xs text-zinc-400">
            Reach out to our operations team for technical support, feedback, or business inquiries.
          </p>
        </div>

        {/* Contact Form */}
        <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
          {isSubmitted ? (
            <div className="text-center py-10 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">TRANSMISSION RECEIVED</h3>
                <p className="text-xs text-zinc-400">Thank you, {name}. Our tactical support team will respond shortly.</p>
              </div>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setName('');
                  setEmail('');
                  setMessage('');
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-emerald-900 hover:border-emerald-500 text-emerald-400 text-xs font-bold transition-all cursor-pointer"
              >
                SEND ANOTHER MESSAGE
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-emerald-400 font-bold uppercase">Callsign / Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Operator / Commander Name"
                  className="w-full bg-black/80 border border-emerald-950 rounded-xl px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-emerald-400 font-bold uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="commander@defense.org"
                  className="w-full bg-black/80 border border-emerald-950 rounded-xl px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-emerald-400 font-bold uppercase">Transmission / Feedback</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message, bug report, or feature request..."
                  className="w-full bg-black/80 border border-emerald-950 rounded-xl px-3 py-2.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all uppercase cursor-pointer"
              >
                <Send className="w-4 h-4" /> SEND TRANSMISSION
              </button>
            </form>
          )}
        </div>

        {/* Direct Email Badge */}
        <div className="text-center text-xs text-zinc-500 space-y-1">
          <p>Direct inquiries: <span className="text-emerald-400">support@readargame.com</span></p>
          <p>&copy; {new Date().getFullYear()} Readar Tactical Operations. All rights reserved.</p>
        </div>

      </div>
    </main>
  );
}
