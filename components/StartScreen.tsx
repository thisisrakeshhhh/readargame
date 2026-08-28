'use client';

import React, { useState, useEffect } from 'react';
import { GeoLocation } from '../types/tactical';
import { WORLD_LOCATIONS, searchLocations } from '../utils/geoLocations';
import { Search, MapPin, Navigation, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StartScreenProps {
  onEnterRadar: (location: GeoLocation) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onEnterRadar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>(WORLD_LOCATIONS[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<GeoLocation[]>(WORLD_LOCATIONS.slice(0, 8));

  // Dynamic Search with Local DB + OpenStreetMap Geocoding fallback
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(WORLD_LOCATIONS.slice(0, 8));
      return;
    }

    const localMatches = searchLocations(trimmed);
    if (localMatches.length > 0) {
      setSearchResults(localMatches);
      setSelectedLocation(localMatches[0]);
    } else {
      // Async geocode fallback using OpenStreetMap Nominatim API for ANY city/town in the world
      const timer = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5`)
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
                theaterType: 'Custom Geographic Sector',
                defenseGrade: 'ALPHA',
                description: `Real geographic sector at ${parseFloat(item.lat).toFixed(2)}°N, ${parseFloat(item.lon).toFixed(2)}°E`,
                silosCount: 4,
                shipsCount: 0,
                jetsCount: 4,
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
        setSearchResults([userGeoLocation, ...WORLD_LOCATIONS.slice(0, 5)]);
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
            TACTICAL RADAR SIMULATION
          </p>
        </div>

        {/* Location Search Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-emerald-400/90 uppercase tracking-wider">
            SELECT OPERATION LOCATION
          </label>
          
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any city or country (e.g. Palwal, Tokyo, Kyiv, Moscow)..."
              className="w-full bg-black/80 border border-emerald-500/50 rounded-xl pl-9 pr-4 py-2.5 text-xs text-emerald-200 placeholder-emerald-700/60 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex gap-1.5 overflow-x-auto py-1">
            {['India', 'Japan', 'Ukraine', 'Russia', 'Iran', 'USA', 'UK'].map((c) => (
              <button
                key={c}
                onClick={() => handleQuickFilter(c)}
                className={`px-2 py-0.5 rounded border text-[10px] transition-all cursor-pointer shrink-0 ${
                  searchQuery.toLowerCase() === c.toLowerCase()
                    ? 'bg-emerald-500 text-black font-bold border-emerald-400'
                    : 'bg-emerald-950/60 border-emerald-900 text-emerald-400 hover:border-emerald-500'
                }`}
              >
                {c}
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
            <div className="text-center py-4 text-xs text-emerald-700">Searching global geography...</div>
          )}
        </div>

        {/* Selected Location Confirmation Badge */}
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedLocation.flag}</span>
            <div>
              <div className="font-bold text-emerald-300">{selectedLocation.name}</div>
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

    </div>
  );
};
