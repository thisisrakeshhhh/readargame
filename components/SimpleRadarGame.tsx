'use client';

import React, { useState } from 'react';
import { GeoLocation } from '../types/tactical';
import { WORLD_LOCATIONS } from '../utils/geoLocations';
import { StartScreen } from './StartScreen';
import { RealGeographicMap } from './RealGeographicMap';
import { RadarCanvas2D, Target2D } from './RadarCanvas2D';
import { RadarControlsHUD } from './RadarControlsHUD';
import { audioEngine } from './AudioEngine';

export const SimpleRadarGame: React.FC = () => {
  const [screen, setScreen] = useState<'START' | 'RADAR'>('START');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>(WORLD_LOCATIONS[0]);
  const [radarRangeKm, setRadarRangeKm] = useState<number>(250);
  const [autoIntercept, setAutoIntercept] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedTarget, setSelectedTarget] = useState<Target2D | null>(null);

  const [stats, setStats] = useState<{ intercepted: number; impacts: number; targets: number }>({
    intercepted: 0,
    impacts: 0,
    targets: 4,
  });

  const handleEnterRadar = (location: GeoLocation) => {
    setSelectedLocation(location);
    setScreen('RADAR');
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  };

  const handleInterceptTarget = (target: Target2D) => {
    if ((window as any).__launchInterceptor) {
      (window as any).__launchInterceptor(target);
    }
  };

  const handleManualStrike = () => {
    if ((window as any).__manualStrike) {
      (window as any).__manualStrike();
    }
  };

  return (
    <div className={`relative bg-black select-none font-mono ${screen === 'START' ? 'w-full min-h-screen overflow-y-auto' : 'w-screen h-screen overflow-hidden'}`}>
      {screen === 'START' ? (
        <StartScreen onEnterRadar={handleEnterRadar} />
      ) : (
        <>
          {/* Layer 1: Real Geographic Map (Leaflet with Dark Tactical CartoDB Tiles) */}
          <RealGeographicMap
            location={selectedLocation}
            radarRangeKm={radarRangeKm}
          />

          {/* Layer 2: 2D Tactical Radar Canvas Overlay */}
          <RadarCanvas2D
            location={selectedLocation}
            radarRangeKm={radarRangeKm}
            autoIntercept={autoIntercept}
            selectedTarget={selectedTarget}
            onSelectTarget={(t) => setSelectedTarget(t)}
            onUpdateStats={(updater) => setStats(updater)}
          />

          {/* Layer 3: Tactical Controls HUD */}
          <RadarControlsHUD
            location={selectedLocation}
            stats={stats}
            radarRangeKm={radarRangeKm}
            autoIntercept={autoIntercept}
            isMuted={isMuted}
            selectedTarget={selectedTarget}
            onSetRadarRange={(r) => setRadarRangeKm(r)}
            onToggleAutoIntercept={() => setAutoIntercept((p) => !p)}
            onToggleMute={handleToggleMute}
            onInterceptTarget={handleInterceptTarget}
            onManualStrike={handleManualStrike}
            onDeselectTarget={() => setSelectedTarget(null)}
            onReturnToStart={() => setScreen('START')}
          />
        </>
      )}
    </div>
  );
};
