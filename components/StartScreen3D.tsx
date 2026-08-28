'use client';

import React, { useState } from 'react';
import { GeoLocation } from '../types/tactical';
import { WORLD_LOCATIONS, searchLocations, findNearestLocation } from '../utils/geoLocations';
import { Search, MapPin, Navigation, Shield, Radio, ChevronRight, Zap, Target } from 'lucide-react';

interface StartScreen3DProps {
  onSelectLocationAndLaunch: (location: GeoLocation) => void;
  onPreviewLocation: (location: GeoLocation) => void;
}

export const StartScreen3D: React.FC<StartScreen3DProps> = ({
  onSelectLocationAndLaunch,
  onPreviewLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoc, setSelectedLoc] = useState<GeoLocation>(WORLD_LOCATIONS[0]);
  const [isLocating, setIsLocating] = useState(false);

  const searchResults = searchLocations(searchQuery);

  const handleSelect = (loc: GeoLocation) => {
    setSelectedLoc(loc);
    onPreviewLocation(loc);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestLocation(latitude, longitude);
        setSelectedLoc({
          ...nearest,
          lat: latitude,
          lng: longitude,
          name: `${nearest.name} (Realtime GPS)`,
        });
        onPreviewLocation(nearest);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 md:p-12 pointer-events-none select-none font-mono text-emerald-400">
      
      {/* Top Header */}
      <div className="text-center pt-2 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 backdrop-blur-md mb-2 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>NORAD EARLY WARNING STRATEGIC NETWORK</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-widest text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
          READAR
        </h1>
        <p className="text-xs md:text-sm text-emerald-400/80 tracking-[0.25em] uppercase mt-1">
          TACTICAL 3D COMMAND SIMULATION
        </p>
      </div>

      {/* Center Search & Operation Theater Selector */}
      <div className="w-full max-w-xl pointer-events-auto my-auto space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-emerald-400/70" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search country, city or region (e.g. India, USA, Ukraine, Iran, Tokyo)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/80 border border-emerald-500/50 text-emerald-200 placeholder-emerald-600/70 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)] backdrop-blur-md transition-all"
          />
        </div>

        {/* Use Current GPS Location Button */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-950/60 border border-emerald-600/40 hover:bg-emerald-900/60 hover:border-emerald-400 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        >
          <Navigation className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          {isLocating ? 'ACQUIRING GPS LOCK...' : 'USE CURRENT LOCATION'}
        </button>

        {/* Results List */}
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {searchResults.map((loc) => {
            const isSelected = selectedLoc.id === loc.id;
            return (
              <div
                key={loc.id}
                onClick={() => handleSelect(loc)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between backdrop-blur-md ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : 'bg-black/60 border-emerald-950/80 hover:border-emerald-700/60 text-emerald-400/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{loc.flag}</span>
                  <div>
                    <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                      {loc.name}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                        {loc.country}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-500/70">{loc.theaterType}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {loc.lat.toFixed(2)}°N, {loc.lng.toFixed(2)}°E
                  </span>
                  <div className="text-[10px] font-bold text-amber-400">GRADE {loc.defenseGrade}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Theater Preview & Launch Button */}
        {selectedLoc && (
          <div className="p-4 rounded-xl bg-black/90 border border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedLoc.flag}</span>
                <div>
                  <div className="font-bold text-sm text-emerald-300">{selectedLoc.name}, {selectedLoc.country}</div>
                  <div className="text-[10px] text-emerald-500/80">LAT: {selectedLoc.lat.toFixed(4)} | LON: {selectedLoc.lng.toFixed(4)}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold">
                {selectedLoc.defenseGrade} GRADE
              </span>
            </div>

            <p className="text-[11px] text-emerald-400/80 leading-relaxed">
              {selectedLoc.description}
            </p>

            <button
              onClick={() => onSelectLocationAndLaunch(selectedLoc)}
              className="w-full py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm tracking-widest flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all uppercase cursor-pointer transform hover:scale-[1.01]"
            >
              <Zap className="w-5 h-5 fill-black" />
              ENTER COMMAND
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>

      {/* Bottom Hint */}
      <div className="text-[11px] text-emerald-600/80 text-center pointer-events-auto">
        ROTATE GLOBE WITH MOUSE | SCROLL TO ZOOM | SELECT THEATER TO INITIALIZE EARLY WARNING SYSTEM
      </div>

    </div>
  );
};
