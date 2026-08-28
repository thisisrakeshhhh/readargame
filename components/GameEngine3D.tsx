'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GeoLocation,
  TacticalContact,
  TacticalMissile,
  Explosion3D,
  TacticalMission,
  IntelLog,
  TacticalStats,
  RadarRange,
  DefenseMode,
  WeaponSystem,
  GameView,
} from '../types/tactical';
import { WORLD_LOCATIONS } from '../utils/geoLocations';
import { TacticalMap3D } from './TacticalMap3D';
import { StartScreen3D } from './StartScreen3D';
import { TacticalHud3D } from './TacticalHud3D';
import { InterceptModal } from './InterceptModal';
import { ManualCockpitController } from './ManualCockpitController';
import { audioEngine } from './AudioEngine';

export const GameEngine3D: React.FC = () => {
  // Game View State
  const [gameView, setGameView] = useState<GameView>('START');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>(WORLD_LOCATIONS[0]);

  // Telemetry & Control States
  const [radarRange, setRadarRange] = useState<RadarRange>(250);
  const [defenseMode, setDefenseMode] = useState<DefenseMode>('AUTO');
  const [isMuted, setIsMuted] = useState(false);

  // Entities & Live Game State
  const [contacts, setContacts] = useState<TacticalContact[]>([]);
  const [missiles, setMissiles] = useState<TacticalMissile[]>([]);
  const [explosions, setExplosions] = useState<Explosion3D[]>([]);
  const [selectedContact, setSelectedContact] = useState<TacticalContact | null>(null);
  const [trackedContactId, setTrackedContactId] = useState<string | null>(null);
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
      id: `missile-${Date.now()}`,
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

    setMissiles((prev) => [...prev, newMissile]);
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

  // Complete Transition into Theater view
  const handleTransitionComplete = () => {
    setGameView('THEATER');
    addIntelLog('DETECTION', `THEATER ACQUIRED: ${selectedLocation.name.toUpperCase()} COMMAND ONLINE.`);
  };

  // Handle Threat Spawning, Movement & Radar Range Detection Loop
  useEffect(() => {
    if (gameView !== 'THEATER') return;

    let spawnCounter = 0;
    const callsignLetters = ['A', 'B', 'X', 'K', 'V', 'Z', 'C', 'D'];

    const interval = setInterval(() => {
      spawnCounter++;

      // 1. Spawning distributed targets around the theater (every 5-6s)
      if (spawnCounter % 5 === 0) {
        const idNum = Math.floor(10 + Math.random() * 89);
        const letter = callsignLetters[Math.floor(Math.random() * callsignLetters.length)];
        const callsign = `${letter}-${idNum}`;

        // Wide realistic geographic distribution (spawns 3-8 degrees away ≈ 300-800 km)
        const angle = Math.random() * Math.PI * 2;
        const distDeg = 3.5 + Math.random() * 5.0;
        const spawnLat = selectedLocation.lat + Math.sin(angle) * distDeg;
        const spawnLng = selectedLocation.lng + Math.cos(angle) * distDeg;

        const isBallistic = Math.random() < 0.5;
        const altKm = isBallistic ? 45 : 10;
        const velocity = isBallistic ? 4.5 : 1.1;

        const newContact: TacticalContact = {
          id: `contact-${Date.now()}`,
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

        setContacts((prev) => [...prev, newContact]);
        addIntelLog('DETECTION', `UNKNOWN CONTACT ${callsign} ON SATELLITE PERIMETER.`);

        // Dynamic Mission Creation
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
      }

      // 2. Advance Contacts Movement & Radar Detection
      setContacts((prevContacts) => {
        const nextContacts: TacticalContact[] = [];

        for (const contact of prevContacts) {
          // Distance in degrees to base
          const distDeg = Math.sqrt(
            Math.pow(contact.lat - selectedLocation.lat, 2) + Math.pow(contact.lng - selectedLocation.lng, 2)
          );
          const distKm = distDeg * 111;

          // Check if contact entered radar range
          const inRadarRange = distKm <= radarRange;
          let nextStatus = contact.status;
          let nextProgress = contact.classificationProgress;

          if (inRadarRange) {
            if (contact.status === 'UNKNOWN') {
              nextStatus = 'CLASSIFYING';
              audioEngine.playRadarPing();
              addIntelLog('DETECTION', `CONTACT ${contact.callsign} ENTERED ${radarRange}KM RADAR RANGE.`);
            } else if (contact.status === 'CLASSIFYING') {
              nextProgress += 25;
              if (nextProgress >= 100) {
                nextStatus = 'HOSTILE';
                addIntelLog('CLASSIFICATION', `CONTACT ${contact.callsign} CLASSIFIED AS ${contact.type.replace('HOSTILE_', '')}.`, contact.threatLevel);
              }
            }
          }

          // Move contact towards base
          const dLat = (contact.targetLat - contact.lat) * 0.02;
          const dLng = (contact.targetLng - contact.lng) * 0.02;
          const newLat = contact.lat + dLat;
          const newLng = contact.lng + dLng;
          const newAlt = Math.max(0.5, contact.altKm - 0.4);

          // Check Impact
          if (distDeg < 0.2) {
            audioEngine.playExplosion();
            setStats((prev) => ({
              ...prev,
              impacts: prev.impacts + 1,
              integrity: Math.max(0, prev.integrity - 15),
            }));
            addIntelLog('IMPACT', `IMPACT CONFIRMED AT ${selectedLocation.name.toUpperCase()}!`, 'CRITICAL');

            setExplosions((prev) => [
              ...prev,
              {
                id: `exp-${Date.now()}`,
                lat: newLat,
                lng: newLng,
                altKm: 0.5,
                radiusKm: 12,
                maxRadiusKm: 12,
                durationSec: 2,
                elapsedSec: 0,
                color: '#ef4444',
              },
            ]);
          } else {
            nextContacts.push({
              ...contact,
              status: nextStatus,
              classificationProgress: Math.min(100, nextProgress),
              lat: newLat,
              lng: newLng,
              altKm: newAlt,
              trajectoryPoints: [...contact.trajectoryPoints, [newLat, newLng, newAlt]],
              etaSeconds: Math.max(1, contact.etaSeconds - 1),
            });
          }
        }

        return nextContacts;
      });

      // 3. Auto AI Iron Dome Defense
      if (defenseMode === 'AUTO') {
        setContacts((currentContacts) => {
          const hostileThreat = currentContacts.find((c) => c.status === 'HOSTILE' && c.classificationProgress >= 80);
          if (hostileThreat && Math.random() < 0.4) {
            const abmWeapon = activeWeapons['ABM_01'];
            if (abmWeapon && abmWeapon.ammo > 0) {
              launchMissile(abmWeapon, hostileThreat, true);
              addIntelLog('AI_DEFENSE', `AUTO AI: INTERCEPTOR LAUNCHED AT ${hostileThreat.callsign} (CONFIDENCE: 94%).`);
            }
          }
          return currentContacts;
        });
      }

      // 4. Update Interceptor Missiles Flight
      setMissiles((prevMissiles) => {
        const nextMissiles: TacticalMissile[] = [];

        for (const m of prevMissiles) {
          const nextProgress = m.flightProgress + 0.1;
          const currentLat = m.sourceLat + (m.targetLat - m.sourceLat) * nextProgress;
          const currentLng = m.sourceLng + (m.targetLng - m.sourceLng) * nextProgress;
          const currentAlt = Math.sin(nextProgress * Math.PI) * 35;

          if (nextProgress >= 1.0) {
            // Detonation & Kill Evaluation
            audioEngine.playExplosion();

            setContacts((prev) =>
              prev.filter((c) => {
                if (c.id === m.targetContactId || Math.abs(c.lat - currentLat) < 0.4) {
                  setStats((prevStats) => ({
                    ...prevStats,
                    intercepted: prevStats.intercepted + 1,
                    score: prevStats.score + c.scoreValue,
                  }));
                  return false;
                }
                return true;
              })
            );

            addIntelLog('INTERCEPT', `INTERCEPT SUCCESS: HOSTILE TARGET NEUTRALIZED.`);

            // Complete mission
            setActiveMissions((prev) =>
              prev.map((mission) =>
                mission.targetContactId === m.targetContactId
                  ? { ...mission, status: 'COMPLETED', progressPercent: 100 }
                  : mission
              )
            );

            // Small 3D Explosion shockwave
            setExplosions((prev) => [
              ...prev,
              {
                id: `exp-${Date.now()}`,
                lat: currentLat,
                lng: currentLng,
                altKm: currentAlt,
                radiusKm: 15,
                maxRadiusKm: 15,
                durationSec: 2,
                elapsedSec: 0,
                color: '#10b981',
              },
            ]);

            if (activeManualMissile?.id === m.id) {
              setActiveManualMissile(null);
            }
          } else {
            nextMissiles.push({
              ...m,
              flightProgress: nextProgress,
              currentLat,
              currentLng,
              currentAltKm: currentAlt,
              fuelPercent: Math.max(0, 100 - nextProgress * 100),
              trajectory: [...m.trajectory, [currentLat, currentLng, currentAlt]],
            });
          }
        }

        return nextMissiles;
      });

      // 5. Update Explosions Decay
      setExplosions((prev) =>
        prev
          .map((e) => ({ ...e, elapsedSec: e.elapsedSec + 0.2 }))
          .filter((e) => e.elapsedSec < e.durationSec)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeManualMissile?.id, activeWeapons, addIntelLog, defenseMode, gameView, launchMissile, radarRange, selectedLocation]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none font-mono">
      {/* 3D WebGL World Layer (Dark Geographic Map with Small Radar Overlay) */}
      <TacticalMap3D
        location={selectedLocation}
        gameView={gameView}
        radarRange={radarRange}
        contacts={contacts}
        missiles={missiles}
        explosions={explosions}
        selectedContact={selectedContact}
        trackedContactId={trackedContactId}
        onSelectContact={(c) => setSelectedContact(c)}
        onContactImpact={() => {}}
        onMissileDetonated={() => {}}
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
          onTrackContact={(c) => setTrackedContactId(c.id)}
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
          targetContact={contacts.find((c) => c.id === activeManualMissile.targetContactId)}
          onSteer={(delta) => {
            setActiveManualMissile((prev) =>
              prev ? { ...prev, manualHeadingOffset: prev.manualHeadingOffset + delta } : null
            );
          }}
          onDetonate={() => {
            setActiveManualMissile(null);
          }}
          onClose={() => setActiveManualMissile(null)}
        />
      )}
    </main>
  );
};
