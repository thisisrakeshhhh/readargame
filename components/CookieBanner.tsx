'use client';

import React, { useState, useEffect } from 'react';
import { PrivacyPreferences } from '../types/game';
import { Shield, Cookie, Check, X } from 'lucide-react';

interface CookieBannerProps {
  onSavePreferences: (prefs: Partial<PrivacyPreferences>) => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onSavePreferences }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [ads, setAds] = useState(true);

  useEffect(() => {
    const savedConsent = localStorage.getItem('readar_cookie_consent');
    if (!savedConsent) {
      setIsOpen(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const prefs = { cookieConsentGiven: true, analyticsEnabled: true, adsEnabled: true };
    localStorage.setItem('readar_cookie_consent', JSON.stringify(prefs));
    onSavePreferences(prefs);
    setIsOpen(false);
  };

  const handleSaveCustom = () => {
    const prefs = { cookieConsentGiven: true, analyticsEnabled: analytics, adsEnabled: ads };
    localStorage.setItem('readar_cookie_consent', JSON.stringify(prefs));
    onSavePreferences(prefs);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-black/90 border border-green-500/50 backdrop-blur-md text-green-400 p-5 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.2)] font-mono">
      <div className="flex items-center gap-3 mb-3 text-green-300">
        <Cookie className="w-5 h-5 animate-pulse text-green-400" />
        <h3 className="font-bold text-sm tracking-wider uppercase">Privacy & Data Transmission</h3>
      </div>
      <p className="text-xs text-green-400/80 mb-4 leading-relaxed">
        We use essential cookies to maintain tactical session state and enable Google AdSense monetization. Choose your telemetry preferences below.
      </p>

      <div className="space-y-2 mb-4 text-xs">
        <label className="flex items-center justify-between p-2 rounded bg-green-950/30 border border-green-800/40 cursor-pointer">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" /> Necessary Cookies (Required)
          </span>
          <input type="checkbox" checked disabled className="accent-green-500" />
        </label>

        <label className="flex items-center justify-between p-2 rounded bg-green-950/30 border border-green-800/40 cursor-pointer">
          <span>Analytics & Performance</span>
          <input 
            type="checkbox" 
            checked={analytics} 
            onChange={(e) => setAnalytics(e.target.checked)} 
            className="accent-green-500 cursor-pointer" 
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded bg-green-950/30 border border-green-800/40 cursor-pointer">
          <span>Personalized Ads (Google AdSense)</span>
          <input 
            type="checkbox" 
            checked={ads} 
            onChange={(e) => setAds(e.target.checked)} 
            className="accent-green-500 cursor-pointer" 
          />
        </label>
      </div>

      <div className="flex gap-2 text-xs">
        <button
          onClick={handleAcceptAll}
          className="flex-1 bg-green-600 hover:bg-green-500 text-black font-bold py-2 px-3 rounded flex items-center justify-center gap-1 transition-all"
        >
          <Check className="w-4 h-4" /> ACCEPT ALL
        </button>
        <button
          onClick={handleSaveCustom}
          className="bg-green-950 border border-green-600/60 hover:bg-green-900 text-green-300 font-semibold py-2 px-3 rounded flex items-center justify-center gap-1 transition-all"
        >
          SAVE PREFS
        </button>
      </div>
    </div>
  );
};
