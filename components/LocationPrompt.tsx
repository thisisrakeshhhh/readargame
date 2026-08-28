'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { COUNTRIES_DATA } from '../utils/mapData';
import { Country } from '../types/game';

interface LocationPromptProps {
  onLocationDetected: (coords: { lat: number; lng: number }, nearestCountry: Country) => void;
  onSkip: () => void;
}

export const LocationPrompt: React.FC<LocationPromptProps> = ({ onLocationDetected, onSkip }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findNearestCountry = (lat: number, lng: number): Country => {
    let nearest = COUNTRIES_DATA[0];
    let minDist = Infinity;

    COUNTRIES_DATA.forEach((country) => {
      const dLat = country.lat - lat;
      const dLng = country.lng - lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDist) {
        minDist = dist;
        nearest = country;
      }
    });

    return nearest;
  };

  const handleRequestLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const matched = findNearestCountry(latitude, longitude);
        setLoading(false);
        onLocationDetected({ lat: latitude, lng: longitude }, matched);
      },
      (err) => {
        setLoading(false);
        setError('Location permission denied or unavailable. Defaulting to manual selection.');
        setTimeout(() => {
          onSkip();
        }, 1500);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="bg-black/90 border border-green-500/40 p-4 rounded-lg text-green-400 font-mono mb-6 max-w-xl mx-auto shadow-[0_0_15px_rgba(34,197,94,0.15)]">
      <div className="flex items-center gap-3 mb-2">
        <Navigation className="w-5 h-5 text-green-400 animate-spin-slow" />
        <h3 className="font-bold text-sm uppercase tracking-wider text-green-300">GEO-TACTICAL AUTOMATIC POSITIONING</h3>
      </div>
      <p className="text-xs text-green-400/80 mb-4">
        Detect your real geographical coordinates to position the radar grid and naval defense perimeter directly over your regional airspace.
      </p>

      {error && (
        <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-950/40 p-2 rounded mb-3 border border-amber-500/30">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleRequestLocation}
          disabled={loading}
          className="flex-1 bg-green-950 border border-green-500 hover:bg-green-600 hover:text-black text-green-400 font-bold py-2 px-4 rounded text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <MapPin className="w-4 h-4" />
          {loading ? 'ACQUIRING GPS LOCK...' : 'AUTO-CENTER MAP WITH GPS'}
        </button>

        <button
          onClick={onSkip}
          className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 py-2 px-4 rounded text-xs transition-all"
        >
          MANUAL SELECT
        </button>
      </div>
    </div>
  );
};
