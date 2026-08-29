'use client';

import React, { useState, useEffect } from 'react';
import { GeoLocation } from '../types/tactical';
import { WORLD_LOCATIONS, searchLocations } from '../utils/geoLocations';
import { Search, Navigation, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AdSenseSlot } from './AdSenseSlot';

interface StartScreenProps {
  onEnterRadar: (location: GeoLocation) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onEnterRadar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>(WORLD_LOCATIONS[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<GeoLocation[]>(WORLD_LOCATIONS.slice(0, 8));

  // Dynamic Search with Local DB + OpenStreetMap Global Geocoding fallback
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(WORLD_LOCATIONS.slice(0, 8));
      return;
    }

    // 1. Instant local database search
    const localMatches = searchLocations(trimmed);
    if (localMatches.length > 0) {
      setSearchResults(localMatches);
    }

    // 2. Real-time global geocoding via OpenStreetMap Nominatim
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const dynamicResults: GeoLocation[] = data.map((item: any, idx: number) => {
              const country = item.address?.country || 'International';
              const countryCode = (item.address?.country_code || 'UN').toUpperCase();
              
              const flag = countryCode.length === 2
                ? countryCode.toUpperCase().replace(/./g, (char: string) => 
                    String.fromCodePoint(127397 + char.charCodeAt(0))
                  )
                : '🌐';

              return {
                id: `osm-${item.place_id || idx}`,
                name: item.name || item.display_name.split(',')[0],
                region: item.address?.state || item.address?.county || 'Strategic Region',
                country,
                countryCode,
                flag,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                theaterType: 'Air Surveillance Sector',
                defenseGrade: 'ALPHA',
                description: `Global Air Defense Sector - ${item.display_name}`,
                silosCount: 6,
                shipsCount: 2,
                jetsCount: 6,
              };
            });

            setSearchResults((prev) => {
              const existingIds = new Set(localMatches.map((l) => l.id));
              const uniqueOsm = dynamicResults.filter((d) => !existingIds.has(d.id));
              return [...localMatches, ...uniqueOsm];
            });
          }
        }
      } catch {
        // Fallback silently to local results on network timeout
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleQuickFilter = (query: string) => {
    setSearchQuery(query);
    const matches = searchLocations(query);
    if (matches.length > 0) {
      setSearchResults(matches);
      setSelectedLocation(matches[0]);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        const userGeoLocation: GeoLocation = {
          id: 'user-live-gps',
          name: 'Current Location',
          region: 'Local Airspace Corridor',
          country: 'Local Operator Base',
          countryCode: 'GPS',
          flag: '📍',
          lat: userLat,
          lng: userLng,
          theaterType: 'Live GPS Tactical Sector',
          defenseGrade: 'OMEGA',
          description: `Live GPS Defense Sector initialized at ${userLat.toFixed(4)}°N, ${userLng.toFixed(4)}°E`,
          silosCount: 6,
          shipsCount: 0,
          jetsCount: 6,
        };

        setSelectedLocation(userGeoLocation);
        setSearchResults([userGeoLocation, ...WORLD_LOCATIONS.slice(0, 6)]);
      },
      (err) => {
        setIsLocating(false);
        alert(`GPS error: ${err.message}. Please enable location permissions.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <main className="w-full min-h-screen bg-black text-emerald-400 font-mono flex flex-col justify-start items-center py-6 sm:py-10 px-3 sm:px-6 select-none relative overflow-y-auto">
      
      {/* Background Subtle Radar Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-15 flex items-center justify-center">
        <div className="w-[550px] h-[550px] rounded-full border border-emerald-500/30 flex items-center justify-center">
          <div className="w-[380px] h-[380px] rounded-full border border-emerald-500/20 flex items-center justify-center">
            <div className="w-[200px] h-[200px] rounded-full border border-emerald-500/20" />
          </div>
        </div>
      </div>

      {/* Main Tactical Card */}
      <div className="max-w-md w-full bg-zinc-950/95 border border-emerald-500/40 p-5 sm:p-7 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.15)] z-10 space-y-4">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-bold tracking-widest uppercase">AIR DEFENSE COMMAND</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white">READAR</h1>
          <p className="text-[11px] text-emerald-500 font-bold uppercase tracking-wider">
            TACTICAL RADAR SURVEILLANCE & INTERCEPTION
          </p>
        </div>

        {/* Location Search Box */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            SELECT SECTOR OR SEARCH CITY
          </label>
          
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city (e.g. Washington, London, Tokyo, Paris)..."
              className="w-full bg-black border border-emerald-500/40 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
          </div>

          {/* Quick Filter Buttons (Safe Allied & International Theaters) */}
          <div className="flex gap-1.5 overflow-x-auto py-1 custom-scrollbar">
            {[
              { label: 'USA', query: 'United States' },
              { label: 'UK', query: 'United Kingdom' },
              { label: 'Japan', query: 'Japan' },
              { label: 'Germany', query: 'Germany' },
              { label: 'France', query: 'France' },
              { label: 'Canada', query: 'Canada' },
              { label: 'Australia', query: 'Australia' },
              { label: 'Italy', query: 'Italy' },
              { label: 'Spain', query: 'Spain' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleQuickFilter(item.query)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                  searchQuery.toLowerCase() === item.query.toLowerCase()
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-emerald-500 hover:text-emerald-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location Search Results List */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 border border-emerald-950 rounded-xl p-1.5 bg-black/80 custom-scrollbar">
          {searchResults.length > 0 ? (
            searchResults.map((loc) => {
              const isSelected = selectedLocation.id === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-emerald-950/80 border border-emerald-400 text-white shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                      : 'hover:bg-zinc-900 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{loc.flag}</span>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span className={isSelected ? 'text-emerald-300' : 'text-zinc-200'}>{loc.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate max-w-[180px]">{loc.country}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-mono">
                    {loc.lat.toFixed(2)}°, {loc.lng.toFixed(2)}°
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-xs text-zinc-500">Searching global coordinates...</div>
          )}
        </div>

        {/* Selected Location Confirmation Banner */}
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedLocation.flag}</span>
            <div>
              <div className="font-bold text-emerald-300">{selectedLocation.name} ({selectedLocation.country})</div>
              <div className="text-[10px] text-zinc-400">{selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lng.toFixed(2)}°E</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 text-[10px] font-bold border border-emerald-600">
            LOCKED
          </span>
        </div>

        {/* GPS Button */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'ACQUIRING GPS...' : 'USE CURRENT GPS LOCATION'}
        </button>

        {/* Enter Radar Button */}
        <button
          onClick={() => onEnterRadar(selectedLocation)}
          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-black font-black text-sm tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all uppercase cursor-pointer"
        >
          <span>ENTER RADAR ({selectedLocation.name.toUpperCase()})</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>

      {/* Google AdSense Display Slot */}
      <div className="w-full max-w-md z-10 my-3">
        <AdSenseSlot slotId="9876543210" format="auto" />
      </div>

      {/* Mandatory Legal & Policy Footer */}
      <footer className="mt-2 mb-6 z-10 text-center space-y-2 text-xs text-zinc-500 max-w-lg px-2">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
          <a href="/how-to-play" className="text-zinc-300 hover:text-emerald-400 font-bold underline transition-colors">How to Play</a>
          <span className="text-zinc-700">|</span>
          <a href="/radar-guide" className="text-zinc-300 hover:text-emerald-400 font-bold underline transition-colors">Radar Guide</a>
          <span className="text-zinc-700">|</span>
          <a href="/privacy" className="text-zinc-400 hover:text-emerald-400 underline transition-colors">Privacy Policy</a>
          <span className="text-zinc-700">|</span>
          <a href="/terms" className="text-zinc-400 hover:text-emerald-400 underline transition-colors">Terms</a>
          <span className="text-zinc-700">|</span>
          <a href="/about" className="text-zinc-400 hover:text-emerald-400 underline transition-colors">About</a>
          <span className="text-zinc-700">|</span>
          <a href="/contact" className="text-zinc-400 hover:text-emerald-400 underline transition-colors">Contact</a>
        </div>
        
        {/* Clear Fictional Disclaimer */}
        <p className="text-[9.5px] text-zinc-600 leading-normal">
          <strong className="text-zinc-500">DISCLAIMER:</strong> ReadarGame is a fictional arcade radar defense game for entertainment and educational demonstration of radar physics. All locations, units, and scenarios are entirely simulated and fictional.
        </p>

        <p className="text-[10px] text-zinc-600">
          &copy; {new Date().getFullYear()} ReadarGame. All rights reserved.
        </p>
      </footer>

    </main>
  );
};
