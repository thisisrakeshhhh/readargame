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
  const [searchResults, setSearchResults] = useState<GeoLocation[]>(WORLD_LOCATIONS.slice(0, 10));

  // Dynamic Search with Local DB + OpenStreetMap Global Geocoding fallback
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(WORLD_LOCATIONS.slice(0, 10));
      return;
    }

    const localMatches = searchLocations(trimmed);
    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      setSelectedLocation(localMatches[0]);
    } else {
      // Async geocode fallback for ANY international city in the world
      const timer = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=6`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              const geocoded: GeoLocation[] = data.map((item, idx) => ({
                id: `geo-${Date.now()}-${idx}`,
                name: item.name || item.display_name.split(',')[0],
                region: item.display_name.split(',').slice(1, 3).join(','),
                country: item.display_name.split(',').slice(-1)[0].trim(),
                countryCode: 'GLOBAL',
                flag: '📍',
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                theaterType: 'International Defense Sector',
                defenseGrade: 'ALPHA',
                description: `Real strategic sector at ${parseFloat(item.lat).toFixed(2)}°N, ${parseFloat(item.lon).toFixed(2)}°E`,
                silosCount: 6,
                shipsCount: 2,
                jetsCount: 6,
              }));
              setSearchResults(geocoded);
              setSelectedLocation(geocoded[0]);
            } else {
              setSearchResults([]);
            }
          })
          .catch(() => {
            setSearchResults([]);
          });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Quick Filter Button Handler
  const handleQuickFilter = (countryName: string) => {
    setSearchQuery(countryName);
    const matches = searchLocations(countryName);
    if (matches.length > 0) {
      setSelectedLocation(matches[0]);
    }
  };

  // Browser GPS Location Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
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
          id: `gps-current-${Date.now()}`,
          name: 'My Current Location',
          region: `${userLat.toFixed(2)}°N, ${userLng.toFixed(2)}°E`,
          country: 'Local Sector',
          countryCode: 'GPS',
          flag: '🛰️',
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
    <div className="w-full h-full min-h-screen bg-black text-emerald-400 font-mono flex flex-col justify-center items-center p-4 select-none relative overflow-hidden">
      
      {/* Background Subtle Radar Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full border border-emerald-500/30 flex items-center justify-center">
          <div className="w-[400px] h-[400px] rounded-full border border-emerald-500/20 flex items-center justify-center">
            <div className="w-[200px] h-[200px] rounded-full border border-emerald-500/20" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full bg-zinc-950/90 border border-emerald-500/40 p-6 md:p-8 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.15)] z-10 space-y-5">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-3xl font-black tracking-widest text-emerald-300">READAR</h1>
          </div>
          <p className="text-xs text-emerald-500/80 font-bold uppercase tracking-wider">
            INTERNATIONAL TACTICAL RADAR SIMULATION
          </p>
        </div>

        {/* Location Search Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-emerald-400/90 uppercase tracking-wider">
            SELECT INTERNATIONAL THEATER
          </label>
          
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any international city (e.g. London, New York, Tokyo, Paris)..."
              className="w-full bg-black/80 border border-emerald-500/50 rounded-xl pl-9 pr-4 py-2.5 text-xs text-emerald-200 placeholder-emerald-700/60 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
          </div>

          {/* Quick Filter Buttons (US / UK / International Powers) */}
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
                className={`px-2.5 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                  searchQuery.toLowerCase() === item.query.toLowerCase()
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                    : 'bg-emerald-950/60 border-emerald-900 text-emerald-400 hover:border-emerald-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location Search Results List */}
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 border border-emerald-950/80 rounded-xl p-1 bg-black/60 custom-scrollbar">
          {searchResults.length > 0 ? (
            searchResults.map((loc) => {
              const isSelected = selectedLocation.id === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                      : 'hover:bg-emerald-950/30 text-emerald-400/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{loc.flag}</span>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{loc.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[10px] text-emerald-600 truncate max-w-[200px]">{loc.country}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {loc.lat.toFixed(2)}°N, {loc.lng.toFixed(2)}°E
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-xs text-emerald-700">Searching international geography...</div>
          )}
        </div>

        {/* Selected Location Confirmation Badge */}
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedLocation.flag}</span>
            <div>
              <div className="font-bold text-emerald-300">{selectedLocation.name} ({selectedLocation.country})</div>
              <div className="text-[10px] text-emerald-600">{selectedLocation.lat.toFixed(2)}°N, {selectedLocation.lng.toFixed(2)}°E</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-400 text-[10px] font-bold border border-emerald-700">
            TARGET LOCKED
          </span>
        </div>

        {/* GPS Button */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="w-full py-2 rounded-xl bg-zinc-900 border border-emerald-900/80 hover:border-emerald-500 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'ACQUIRING GPS COORDINATES...' : 'USE CURRENT LOCATION'}
        </button>

        {/* Enter Radar Button */}
        <button
          onClick={() => onEnterRadar(selectedLocation)}
          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all uppercase cursor-pointer"
        >
          <span>ENTER RADAR ({selectedLocation.name.toUpperCase()})</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>

      {/* Google AdSense Display Slot */}
      <div className="w-full max-w-md z-10 my-2">
        <AdSenseSlot slotId="9876543210" format="auto" />
      </div>

      {/* Mandatory AdSense & Legal Compliance Navigation */}
      <footer className="mt-4 z-10 text-center space-y-2.5 text-xs text-zinc-500 max-w-lg px-2">
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

    </div>
  );
};
