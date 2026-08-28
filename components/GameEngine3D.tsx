'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GeoLocation,
  TacticalContact,
  TacticalMissile,
  TacticalMission,
  IntelLog,
  TacticalStats,
  RadarRange,
  DefenseMode,
  WeaponSystem,
  GameView,
} from '../types/tactical';
import { WORLD_LOCATIONS } from '../utils/geoLocations';
import { TacticalMap3D, TacticalMap3DHandle } from './TacticalMap3D';
import { StartScreen3D } from './StartScreen3D';
import { TacticalHud3D } from './TacticalHud3D';
import { InterceptModal } from './InterceptModal';
import { ManualCockpitController } from './ManualCockpitController';
import { audioEngine } from './AudioEngine';

export const GameEngine3D: React.FC = () => {
  const mapRef = useRef<TacticalMap3DHandle | null>(null);

  // Game View State
  const [gameView, setGameView] = useState<GameView>('START');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>(WORLD_LOCATIONS[0]);

  // Telemetry & Control States
  const [radarRange, setRadarRange] = useState<RadarRange>(250);
  const [defenseMode, setDefenseMode] = useState<DefenseMode>('AUTO');
  const [isMuted, setIsMuted] = useState(false);

  // Discrete React UI States
  const [selectedContact, setSelectedContact] = useState<TacticalContact | null>(null);
  const [activeManualMissile, setActiveManualMissile] = useState<TacticalMissile | null>(null);
  const [interceptModalContact, setInterceptModalContact] = useState<TacticalContact | null>(null);

  // Weapons Inventory
  const [activeWeapons, setActiveWeapons] = useState<Record<string, WeaponSystem>>({
    ABM_01: {
      id: 'ABM_01',
      name: 'ABM-03 THUNDER',
      type: 'ABM',
      rangeKm: 500,
      speedMach: 5.5,
      ammo: 12,
      maxAmmo: 12,
      successProbability: 94,
      description: 'Long-range Exoatmospheric Anti-Ballistic Interceptor Missile.',
    },
    SAM_PATRIOT: {
      id: 'SAM_PATRIOT',
      name: 'PAC-3 PATRIOT',
      type: 'SAM',
      rangeKm: 180,
      speedMach: 4.1,
      ammo: 24,
      maxAmmo: 24,
      successProbability: 88,
      description: 'High-speed Surface-to-Air Missile against cruise missiles and aircraft.',
    },
    AAM_SIDEWINDER: {
      id: 'AAM_SIDEWINDER',
      name: 'METEOR AAM',
      type: 'AAM',
      rangeKm: 120,
      speedMach: 4.0,
      ammo: 16,
      maxAmmo: 16,
      successProbability: 85,
      description: 'Beyond-Visual-Range Air-to-Air Scramble Missile.',
    },
  });

  // Statistics
  const [stats, setStats] = useState<TacticalStats>({
    intercepted: 0,
    impacts: 0,
    shotsFired: 0,
    manualShots: 0,
    autoShots: 0,
    score: 0,
    integrity: 100,
    threatLevel: 'MED',
    wave: 1,
  });

  // Missions
  const [activeMissions, setActiveMissions] = useState<TacticalMission[]>([
    {
      id: 'm-1',
      code: 'MISSION 01',
      title: 'THEATER AIR DEFENSE',
      type: 'AIR_DEFENSE',
      objective: 'Maintain airspace defense perimeter and protect regional theater.',
      secondaryObjective: 'Achieve >80% interception accuracy.',
      status: 'ACTIVE',
      rewardScore: 1000,
      progressPercent: 0,
    },
  ]);

  // Live Intelligence Feed Logs
  const [intelLogs, setIntelLogs] = useState<IntelLog[]>([
    { id: '1', timestamp: '17:40:00', category: 'DETECTION', message: 'STRATEGIC EARLY WARNING RADAR ONLINE.' },
    { id: '2', timestamp: '17:40:05', category: 'WARNING', message: 'DEFENSE SECTOR INITIALIZED: READY FOR CONTACTS.' },
  ]);

  const addIntelLog = useCallback((category: IntelLog['category'], message: string, threatLevel?: IntelLog['threatLevel']) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setIntelLogs((prev) => [
      ...prev.slice(-20),
      { id: `log-${Date.now()}-${Math.random()}`, timestamp: timeStr, category, message, threatLevel },
    ]);
  }, []);

  // Launch Interceptor Missile Function
  const launchMissile = useCallback((weapon: WeaponSystem, targetContact: TacticalContact, isAuto: boolean = false) => {
    if (weapon.ammo <= 0) return;

    setActiveWeapons((prev) => ({
      ...prev,
      [weapon.id]: {
        ...prev[weapon.id],
        ammo: Math.max(0, prev[weapon.id].ammo - 1),
      },
    }));

    setStats((prev) => ({
      ...prev,
      shotsFired: prev.shotsFired + 1,
      manualShots: isAuto ? prev.manualShots : prev.manualShots + 1,
      autoShots: isAuto ? prev.autoShots + 1 : prev.autoShots,
    }));

    const newMissile: TacticalMissile = {
      id: `missile-${Date.now()}-${Math.random()}`,
      weaponId: weapon.id,
      sourceName: `${selectedLocation.name} Base`,
      sourceLat: selectedLocation.lat,
      sourceLng: selectedLocation.lng,
      currentLat: selectedLocation.lat,
      currentLng: selectedLocation.lng,
      currentAltKm: 0.2,
      targetContactId: targetContact.id,
      targetLat: targetContact.lat,
      targetLng: targetContact.lng,
      speedMach: weapon.speedMach,
      isManualGuidance: !isAuto,
      manualHeadingOffset: 0,
      fuelPercent: 100,
      flightProgress: 0,
      trajectory: [[selectedLocation.lat, selectedLocation.lng, 0.2]],
    };

    // Push directly into live 60 FPS Three.js engine
    mapRef.current?.launchMissile(newMissile);

    if (!isAuto) {
      setActiveManualMissile(newMissile);
    }

    audioEngine.playMissileLaunch();
    addIntelLog('LAUNCH', `INTERCEPTOR ${weapon.name} LAUNCHED AT ${targetContact.callsign}.`);
  }, [addIntelLog, selectedLocation]);

  // Start Location and initiate smooth camera transition
  const handleSelectLocationAndLaunch = (location: GeoLocation) => {
    setSelectedLocation(location);
    setGameView('TRANSITION');
    addIntelLog('DETECTION', `COMMENCING ORBITAL DESCENT TO ${location.name.toUpperCase()}.`);
  };

  const handleTransitionComplete = () => {
    setGameView('THEATER');
    addIntelLog('DETECTION', `THEATER ACQUIRED: ${selectedLocation.name.toUpperCase()} COMMAND ONLINE.`);
  };

  // Event Handlers from Three.js Simulation Loop (Discrete state updates only)
  const handleContactDetected = useCallback((contact: TacticalContact) => {
    addIntelLog('DETECTION', `CONTACT ${contact.callsign} ENTERED RADAR RANGE.`);
  }, [addIntelLog]);

  const handleContactClassified = useCallback((contact: TacticalContact) => {
    addIntelLog('CLASSIFICATION', `CONTACT ${contact.callsign} CLASSIFIED AS ${contact.type.replace('HOSTILE_', '')}.`, contact.threatLevel);

    // If AUTO AI is active, dispatch interceptor
    if (defenseMode === 'AUTO') {
      const weapon = activeWeapons['ABM_01']?.ammo > 0 ? activeWeapons['ABM_01'] : activeWeapons['SAM_PATRIOT'];
      if (weapon && weapon.ammo > 0) {
        launchMissile(weapon, contact, true);
        addIntelLog('AI_DEFENSE', `AUTO AI: INTERCEPTOR LAUNCHED AT ${contact.callsign} (CONFIDENCE: 94%).`);
      }
    }
  }, [activeWeapons, addIntelLog, defenseMode, launchMissile]);

  const handleContactImpact = useCallback((contact: TacticalContact) => {
    setStats((prev) => ({
      ...prev,
      impacts: prev.impacts + 1,
      integrity: Math.max(0, prev.integrity - 15),
    }));
    addIntelLog('IMPACT', `IMPACT CONFIRMED AT ${selectedLocation.name.toUpperCase()}!`, 'CRITICAL');
  }, [addIntelLog, selectedLocation]);

  const handleMissileIntercept = useCallback((missile: TacticalMissile, hitContact: TacticalContact) => {
    setStats((prev) => ({
      ...prev,
      intercepted: prev.intercepted + 1,
      score: prev.score + hitContact.scoreValue,
    }));
    addIntelLog('INTERCEPT', `INTERCEPT SUCCESS: ${hitContact.callsign} DESTROYED.`);

    setActiveMissions((prev) =>
      prev.map((m) =>
        m.targetContactId === hitContact.id
          ? { ...m, status: 'COMPLETED', progressPercent: 100 }
          : m
      )
    );

    setActiveManualMissile((prev) => (prev?.id === missile.id ? null : prev));
  }, [addIntelLog]);

  // Periodic Threat Spawner (Pushes to Three.js engine every 5s)
  useEffect(() => {
    if (gameView !== 'THEATER') return;

    const callsignLetters = ['A', 'B', 'X', 'K', 'V', 'Z', 'C', 'D'];
    let count = 0;

    const interval = setInterval(() => {
      count++;
      const idNum = Math.floor(10 + Math.random() * 89);
      const letter = callsignLetters[Math.floor(Math.random() * callsignLetters.length)];
      const callsign = `${letter}-${idNum}`;

      // Distribute widely around theater (3.5 to 8 degrees away ≈ 300 to 800 km)
      const angle = Math.random() * Math.PI * 2;
      const distDeg = 3.5 + Math.random() * 4.5;
      const spawnLat = selectedLocation.lat + Math.sin(angle) * distDeg;
      const spawnLng = selectedLocation.lng + Math.cos(angle) * distDeg;

      const isBallistic = Math.random() < 0.5;
      const altKm = isBallistic ? 45 : 10;
      const velocity = isBallistic ? 4.5 : 1.1;

      const newContact: TacticalContact = {
        id: `contact-${Date.now()}-${Math.random()}`,
        callsign,
        type: isBallistic ? 'HOSTILE_BALLISTIC' : 'HOSTILE_CRUISE',
        status: 'UNKNOWN',
        lat: spawnLat,
        lng: spawnLng,
        altKm,
        originLat: spawnLat,
        originLng: spawnLng,
        targetLat: selectedLocation.lat,
        targetLng: selectedLocation.lng,
        velocityKmS: velocity,
        headingDeg: Math.round(((angle + Math.PI) * (180 / Math.PI)) % 360),
        threatLevel: isBallistic ? 'CRITICAL' : 'HIGH',
        etaSeconds: Math.round((distDeg * 111) / (velocity * 3.6)),
        classificationProgress: 0,
        scoreValue: isBallistic ? 250 : 150,
        trajectoryPoints: [[spawnLat, spawnLng, altKm]],
      };

      // Push directly into live 60 FPS Three.js engine
      mapRef.current?.spawnContact(newContact);
      addIntelLog('DETECTION', `UNKNOWN CONTACT ${callsign} ON SATELLITE PERIMETER.`);

      // Add to missions
      setActiveMissions((prev) => [
        ...prev.filter((m) => m.id !== `m-${callsign}`),
        {
          id: `m-${callsign}`,
          code: `INTERCEPT-${callsign}`,
          title: `INTERCEPT CONTACT ${callsign}`,
          type: 'INTERCEPT_CONTACT',
          objective: `Track and neutralize approaching contact ${callsign} before impact.`,
          secondaryObjective: 'Authorize SAM / ABM launch.',
          targetContactId: newContact.id,
          threatCallsign: callsign,
          eta: `${newContact.etaSeconds}s`,
          status: 'ACTIVE',
          rewardScore: newContact.scoreValue,
          progressPercent: 0,
        },
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, [addIntelLog, gameView, selectedLocation]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none font-mono">
      {/* 3D WebGL World Layer (Continuous 60 FPS Delta-Time Simulation) */}
      <TacticalMap3D
        ref={mapRef}
        location={selectedLocation}
        gameView={gameView}
        radarRange={radarRange}
        selectedContactId={selectedContact?.id || null}
        onSelectContact={(c) => setSelectedContact(c)}
        onContactDetected={handleContactDetected}
        onContactClassified={handleContactClassified}
        onContactImpact={handleContactImpact}
        onMissileIntercept={handleMissileIntercept}
        onTransitionComplete={handleTransitionComplete}
      />

      {/* Screen 1: Start & Global Search */}
      {gameView === 'START' && (
        <StartScreen3D
          onSelectLocationAndLaunch={handleSelectLocationAndLaunch}
          onPreviewLocation={(loc) => setSelectedLocation(loc)}
        />
      )}

      {/* Screen 2: Tactical HUD */}
      {gameView === 'THEATER' && (
        <TacticalHud3D
          location={selectedLocation}
          stats={stats}
          radarRange={radarRange}
          defenseMode={defenseMode}
          selectedContact={selectedContact}
          activeMissions={activeMissions}
          intelLogs={intelLogs}
          activeWeapons={activeWeapons}
          isMuted={isMuted}
          onSetRadarRange={setRadarRange}
          onToggleDefenseMode={() => setDefenseMode((p) => (p === 'MANUAL' ? 'AUTO' : 'MANUAL'))}
          onToggleMute={handleToggleMute}
          onTrackContact={(c) => setSelectedContact(c)}
          onOpenInterceptSequence={(c) => setInterceptModalContact(c)}
          onReturnToOrbit={() => setGameView('START')}
        />
      )}

      {/* Multi-Weapon Intercept Sequence Modal */}
      {interceptModalContact && (
        <InterceptModal
          contact={interceptModalContact}
          weapons={activeWeapons}
          onAuthorizeLaunch={(w, target) => launchMissile(w, target, false)}
          onClose={() => setInterceptModalContact(null)}
        />
      )}

      {/* Manual Cockpit Guidance Flight Controller */}
      {activeManualMissile && (
        <ManualCockpitController
          missile={activeManualMissile}
          onSteer={(delta) => {
            mapRef.current?.steerManualMissile(activeManualMissile.id, delta);
          }}
          onDetonate={() => {
            mapRef.current?.detonateManualMissile(activeManualMissile.id);
            setActiveManualMissile(null);
          }}
          onClose={() => setActiveManualMissile(null)}
        />
      )}
    </main>
  );
};
