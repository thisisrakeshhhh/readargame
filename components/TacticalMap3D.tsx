'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import {
  GeoLocation,
  TacticalContact,
  TacticalMissile,
  Explosion3D,
  RadarRange,
  GameView,
  WeaponSystem,
} from '../types/tactical';
import {
  GLOBE_RADIUS,
  THEATER_MAP_SIZE,
  geoToTheaterMapCoords,
  generateRegionalTacticalMapTexture,
  generateTacticalEarthTexture,
  createAtmosphereMesh,
  createStarfield,
} from '../utils/threeTactical';
import { audioEngine } from './AudioEngine';

export interface TacticalMap3DHandle {
  spawnContact: (contact: TacticalContact) => void;
  launchMissile: (missile: TacticalMissile) => void;
  steerManualMissile: (missileId: string, headingDelta: number) => void;
  detonateManualMissile: (missileId: string) => void;
}

interface TacticalMap3DProps {
  location: GeoLocation;
  gameView: GameView;
  radarRange: RadarRange;
  selectedContactId: string | null;
  onSelectContact: (contact: TacticalContact | null) => void;
  onContactDetected: (contact: TacticalContact) => void;
  onContactClassified: (contact: TacticalContact) => void;
  onContactImpact: (contact: TacticalContact) => void;
  onMissileIntercept: (missile: TacticalMissile, hitContact: TacticalContact) => void;
  onTransitionComplete?: () => void;
}

const MAX_CONTACT_POOL = 30;
const MAX_MISSILE_POOL = 10;
const MAX_EXPLOSION_POOL = 10;
const MAX_TRAIL_POINTS = 40;

const mapTextureCache: Record<string, THREE.CanvasTexture> = {};

export const TacticalMap3D = forwardRef<TacticalMap3DHandle, TacticalMap3DProps>(({
  location,
  gameView,
  radarRange,
  selectedContactId,
  onSelectContact,
  onContactDetected,
  onContactClassified,
  onContactImpact,
  onMissileIntercept,
  onTransitionComplete,
}, ref) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // STABLE REFS FOR PROPS & EVENT CALLBACKS
  const locationRef = useRef(location);
  locationRef.current = location;

  const gameViewRef = useRef(gameView);
  gameViewRef.current = gameView;

  const radarRangeRef = useRef(radarRange);
  radarRangeRef.current = radarRange;

  const selectedContactIdRef = useRef(selectedContactId);
  selectedContactIdRef.current = selectedContactId;

  const onSelectContactRef = useRef(onSelectContact);
  onSelectContactRef.current = onSelectContact;

  const onContactDetectedRef = useRef(onContactDetected);
  onContactDetectedRef.current = onContactDetected;

  const onContactClassifiedRef = useRef(onContactClassified);
  onContactClassifiedRef.current = onContactClassified;

  const onContactImpactRef = useRef(onContactImpact);
  onContactImpactRef.current = onContactImpact;

  const onMissileInterceptRef = useRef(onMissileIntercept);
  onMissileInterceptRef.current = onMissileIntercept;

  const onTransitionCompleteRef = useRef(onTransitionComplete);
  onTransitionCompleteRef.current = onTransitionComplete;

  // HIGH-FREQUENCY MUTABLE SIMULATION STATE (OWNED ENTIRELY BY THREE.JS RAF)
  const simContactsRef = useRef<TacticalContact[]>([]);
  const simMissilesRef = useRef<TacticalMissile[]>([]);
  const simExplosionsRef = useRef<Explosion3D[]>([]);

  // Camera Pan & Zoom Refs
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraPanOffsetRef = useRef({ x: 0, z: 0 });
  const cameraZoomRef = useRef(140);
  const targetCameraZoomRef = useRef(140);
  const transitionProgressRef = useRef(0);
  const isTransitioningRef = useRef(false);

  // Expose methods to push game events from React into high-frequency RAF loop
  useImperativeHandle(ref, () => ({
    spawnContact: (contact: TacticalContact) => {
      simContactsRef.current = [...simContactsRef.current.slice(-(MAX_CONTACT_POOL - 1)), contact];
    },
    launchMissile: (missile: TacticalMissile) => {
      simMissilesRef.current = [...simMissilesRef.current.slice(-(MAX_MISSILE_POOL - 1)), missile];
    },
    steerManualMissile: (missileId: string, headingDelta: number) => {
      const m = simMissilesRef.current.find((item) => item.id === missileId);
      if (m) {
        m.manualHeadingOffset += headingDelta;
      }
    },
    detonateManualMissile: (missileId: string) => {
      const idx = simMissilesRef.current.findIndex((item) => item.id === missileId);
      if (idx !== -1) {
        const m = simMissilesRef.current[idx];
        m.flightProgress = 1.0;
      }
    },
  }));

  // THREE.JS SCENE INITIALIZATION & 60 FPS DELTA-TIME RAF SIMULATION LOOP
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;

    // 1. Setup Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
    camera.position.set(0, 70, 300);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    container.appendChild(renderer.domElement);

    // 2. Starfield & Lighting
    const starfield = createStarfield();
    scene.add(starfield);

    const ambientLight = new THREE.AmbientLight(0x102820, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xdcfce7, 1.8);
    sunLight.position.set(100, 200, 150);
    scene.add(sunLight);

    // 3. START SCREEN: 3D Earth Globe Group (Low poly, visible only in Start view)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const earthTexture = generateTacticalEarthTexture();
    const globeGeom = new THREE.SphereGeometry(GLOBE_RADIUS, 32, 24);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.2,
      emissive: new THREE.Color(0x021810),
      emissiveIntensity: 0.3,
    });
    const globeMesh = new THREE.Mesh(globeGeom, globeMat);
    globeGroup.add(globeMesh);

    const atmosphere = createAtmosphereMesh();
    globeGroup.add(atmosphere);

    // 4. THEATER GAMEPLAY: Dark Geographic Map (75-85% of Viewport)
    const theaterMapGroup = new THREE.Group();
    theaterMapGroup.visible = false;
    scene.add(theaterMapGroup);

    let initialMapTexture = mapTextureCache[locationRef.current.id];
    if (!initialMapTexture) {
      initialMapTexture = generateRegionalTacticalMapTexture(locationRef.current);
      mapTextureCache[locationRef.current.id] = initialMapTexture;
    }

    const mapGeom = new THREE.PlaneGeometry(THEATER_MAP_SIZE, THEATER_MAP_SIZE);
    const mapMat = new THREE.MeshStandardMaterial({
      map: initialMapTexture,
      roughness: 0.8,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const mapMesh = new THREE.Mesh(mapGeom, mapMat);
    mapMesh.rotation.x = -Math.PI / 2;
    mapMesh.position.set(0, 0, 0);
    theaterMapGroup.add(mapMesh);

    // Base Marker
    const baseGeom = new THREE.RingGeometry(1.0, 1.8, 16);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.set(0, 0.4, 0);
    theaterMapGroup.add(baseMesh);

    // 5. SMALL TACTICAL RADAR OVERLAY (20-30% of Viewport, Radius ~24 units)
    const radarOverlayGroup = new THREE.Group();
    theaterMapGroup.add(radarOverlayGroup);

    const radarBaseRadius = 24;
    const ringRadii = [6, 12, 18, 24];
    const ringMeshes: THREE.Mesh[] = [];

    ringRadii.forEach((r, idx) => {
      const ringG = new THREE.RingGeometry(r - 0.15, r, 32);
      const ringM = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: idx === ringRadii.length - 1 ? 0.45 : 0.18,
        side: THREE.DoubleSide,
      });
      const rMesh = new THREE.Mesh(ringG, ringM);
      rMesh.rotation.x = -Math.PI / 2;
      rMesh.position.set(0, 0.25, 0);
      radarOverlayGroup.add(rMesh);
      ringMeshes.push(rMesh);
    });

    // 8 Bearing Radial Lines (thin, subtle)
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.23, 0),
        new THREE.Vector3(Math.cos(a) * radarBaseRadius, 0.23, Math.sin(a) * radarBaseRadius),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.12 });
      const bLine = new THREE.Line(lineGeom, lineMat);
      radarOverlayGroup.add(bLine);
    }

    // Small rotating sweep wedge
    const sweepGeom = new THREE.CircleGeometry(radarBaseRadius, 24, 0, Math.PI / 5);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const sweepMesh = new THREE.Mesh(sweepGeom, sweepMat);
    sweepMesh.rotation.x = -Math.PI / 2;
    sweepMesh.position.set(0, 0.22, 0);
    radarOverlayGroup.add(sweepMesh);

    // 6. PRE-ALLOCATED CONTACTS POOL
    const contactsGroup = new THREE.Group();
    theaterMapGroup.add(contactsGroup);

    const contactMeshes: THREE.Mesh[] = [];
    const contactLineGeoms: THREE.BufferGeometry[] = [];
    const contactLineMeshes: THREE.Line[] = [];

    const hostileMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const unknownMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const classifyingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const friendlyMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });

    const contactDiamondGeom = new THREE.RingGeometry(0.5, 0.9, 4); // Unknown ◇
    const contactConeGeom = new THREE.ConeGeometry(0.7, 1.4, 6); // Hostile × / Cone
    const contactCircleGeom = new THREE.CircleGeometry(0.7, 8); // Friendly ●

    for (let i = 0; i < MAX_CONTACT_POOL; i++) {
      const mesh = new THREE.Mesh(contactDiamondGeom, unknownMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      contactsGroup.add(mesh);
      contactMeshes.push(mesh);

      const linePositions = new Float32Array(MAX_TRAIL_POINTS * 3);
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const lineMat = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35 });
      const line = new THREE.Line(lineGeom, lineMat);
      line.visible = false;
      contactsGroup.add(line);
      contactLineGeoms.push(lineGeom);
      contactLineMeshes.push(line);
    }

    // 7. PRE-ALLOCATED MISSILES POOL
    const missilesGroup = new THREE.Group();
    theaterMapGroup.add(missilesGroup);

    const missileMeshes: THREE.Mesh[] = [];
    const missileLineGeoms: THREE.BufferGeometry[] = [];
    const missileLineMeshes: THREE.Line[] = [];

    const missileMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const missileGeom = new THREE.SphereGeometry(0.6, 6, 6);

    for (let i = 0; i < MAX_MISSILE_POOL; i++) {
      const mesh = new THREE.Mesh(missileGeom, missileMat);
      mesh.visible = false;
      missilesGroup.add(mesh);
      missileMeshes.push(mesh);

      const mLinePositions = new Float32Array(MAX_TRAIL_POINTS * 3);
      const mLineGeom = new THREE.BufferGeometry();
      mLineGeom.setAttribute('position', new THREE.BufferAttribute(mLinePositions, 3));
      const mLineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
      const mLine = new THREE.Line(mLineGeom, mLineMat);
      mLine.visible = false;
      missilesGroup.add(mLine);
      missileLineGeoms.push(mLineGeom);
      missileLineMeshes.push(mLine);
    }

    // 8. PRE-ALLOCATED EXPLOSIONS POOL
    const explosionsGroup = new THREE.Group();
    theaterMapGroup.add(explosionsGroup);

    const explosionMeshes: THREE.Mesh[] = [];
    const expRingGeom = new THREE.RingGeometry(8, 9, 24);

    for (let i = 0; i < MAX_EXPLOSION_POOL; i++) {
      const expMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(expRingGeom, expMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      explosionsGroup.add(mesh);
      explosionMeshes.push(mesh);
    }

    // 9. MOUSE PAN / ZOOM HANDLERS
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      if (gameViewRef.current === 'THEATER') {
        cameraPanOffsetRef.current.x -= deltaX * 0.15;
        cameraPanOffsetRef.current.z -= deltaY * 0.15;
      }

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetCameraZoomRef.current = Math.max(60, Math.min(240, targetCameraZoomRef.current + e.deltaY * 0.15));
    };

    const handleClick = (e: MouseEvent) => {
      if (!container || gameViewRef.current !== 'THEATER') return;
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / container.clientWidth) * 2 - 1,
        -((e.clientY - rect.top) / container.clientHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const activeMeshes = contactMeshes.filter((m) => m.visible);
      const intersects = raycaster.intersectObjects(activeMeshes, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const cid = hit.userData?.contactId;
        if (cid) {
          const found = simContactsRef.current.find((c) => c.id === cid);
          if (found) {
            onSelectContactRef.current(found);
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. REAL-TIME 60 FPS DELTA-TIME SIMULATION & RENDER LOOP
    let animId: number;
    let previousTime = performance.now();
    let sweepAngle = 0;

    const animate = (currentTime: number) => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      if (document.hidden) {
        previousTime = currentTime;
        return;
      }

      // Delta time in seconds (clamped to prevent huge jumps)
      const deltaTime = Math.min(0.1, (currentTime - previousTime) / 1000);
      previousTime = currentTime;

      const currentView = gameViewRef.current;
      const loc = locationRef.current;
      const currentRadarRange = radarRangeRef.current;

      cameraZoomRef.current += (targetCameraZoomRef.current - cameraZoomRef.current) * 0.08;

      if (currentView === 'START') {
        globeGroup.visible = true;
        theaterMapGroup.visible = false;
        starfield.visible = true;

        globeMesh.rotation.y += 0.8 * deltaTime;
        camera.position.set(0, 60, cameraZoomRef.current);
        camera.lookAt(0, 0, 0);
      } else if (currentView === 'TRANSITION') {
        globeGroup.visible = true;
        theaterMapGroup.visible = true;
        starfield.visible = true;

        transitionProgressRef.current += 0.8 * deltaTime;
        const p = Math.min(1.0, transitionProgressRef.current);

        camera.position.set(0, THREE.MathUtils.lerp(60, 135, p), THREE.MathUtils.lerp(300, 70, p));
        camera.lookAt(0, 0, 0);

        if (p >= 1.0) {
          isTransitioningRef.current = false;
          globeGroup.visible = false;
          starfield.visible = false;
          onTransitionCompleteRef.current?.();
        }
      } else if (currentView === 'THEATER') {
        globeGroup.visible = false;
        theaterMapGroup.visible = true;
        starfield.visible = false;

        const pan = cameraPanOffsetRef.current;
        const zoom = cameraZoomRef.current;

        camera.position.set(pan.x, zoom, pan.z + zoom * 0.45);
        camera.lookAt(pan.x, 0, pan.z);

        // CONTINUOUS ROTATING RADAR SWEEP
        sweepAngle = (sweepAngle + 1.8 * deltaTime) % (Math.PI * 2);
        sweepMesh.rotation.z = sweepAngle;

        const rangeFraction = currentRadarRange / 500;
        sweepMesh.scale.set(rangeFraction, rangeFraction, 1);
        ringMeshes.forEach((rm, i) => {
          rm.visible = (i + 1) * 125 <= currentRadarRange + 25;
        });

        // 11. CONTINUOUS 60 FPS CONTACTS PHYSICS & DETECTION
        const liveContacts = simContactsRef.current;
        const survivingContacts: TacticalContact[] = [];

        for (let i = 0; i < liveContacts.length; i++) {
          const c = liveContacts[i];

          // Continuous delta-time movement towards base
          const dLat = (loc.lat - c.lat);
          const dLng = (loc.lng - c.lng);
          const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);

          // Unit direction vector
          const dirLat = distDeg > 0.001 ? dLat / distDeg : 0;
          const dirLng = distDeg > 0.001 ? dLng / distDeg : 0;

          // Speed in degrees per second (velocityKmS / 111)
          const speedDegS = (c.velocityKmS / 111) * 0.4;
          const newLat = c.lat + dirLat * speedDegS * deltaTime;
          const newLng = c.lng + dirLng * speedDegS * deltaTime;
          const newAlt = Math.max(0.5, c.altKm - 0.2 * deltaTime);

          const distKm = distDeg * 111;
          const inRadar = distKm <= currentRadarRange;

          let status = c.status;
          let progress = c.classificationProgress;

          // Continuous radar detection & classification
          if (inRadar) {
            if (status === 'UNKNOWN') {
              status = 'CLASSIFYING';
              audioEngine.playRadarPing();
              onContactDetectedRef.current(c);
            } else if (status === 'CLASSIFYING') {
              progress += 30 * deltaTime;
              if (progress >= 100) {
                status = 'HOSTILE';
                onContactClassifiedRef.current(c);
              }
            }
          }

          // Check Base Impact
          if (distDeg < 0.18) {
            audioEngine.playExplosion();
            onContactImpactRef.current(c);

            // Spawn explosion in mutable pool
            simExplosionsRef.current = [
              ...simExplosionsRef.current.slice(-(MAX_EXPLOSION_POOL - 1)),
              {
                id: `exp-${Date.now()}`,
                lat: newLat,
                lng: newLng,
                altKm: 0.5,
                radiusKm: 12,
                maxRadiusKm: 12,
                durationSec: 1.8,
                elapsedSec: 0,
                color: '#ef4444',
              },
            ];
          } else {
            // Trajectory points update (capped at MAX_TRAIL_POINTS)
            const boundedTrajectory: [number, number, number][] = [
              ...c.trajectoryPoints.slice(-(MAX_TRAIL_POINTS - 1)),
              [newLat, newLng, newAlt],
            ];

            survivingContacts.push({
              ...c,
              lat: newLat,
              lng: newLng,
              altKm: newAlt,
              status,
              classificationProgress: progress,
              trajectoryPoints: boundedTrajectory,
              etaSeconds: Math.max(1, distKm / Math.max(1, c.velocityKmS * 3.6)),
            });
          }
        }
        simContactsRef.current = survivingContacts;

        // 12. CONTINUOUS 60 FPS MISSILES GUIDANCE & INTERCEPT
        const liveMissiles = simMissilesRef.current;
        const survivingMissiles: TacticalMissile[] = [];

        for (let i = 0; i < liveMissiles.length; i++) {
          const m = liveMissiles[i];
          // Continuous flight progress
          const progressDelta = (m.speedMach * 0.08) * deltaTime;
          const nextProgress = m.flightProgress + progressDelta;

          const currentLat = m.sourceLat + (m.targetLat - m.sourceLat) * nextProgress;
          const currentLng = m.sourceLng + (m.targetLng - m.sourceLng) * nextProgress;
          const currentAlt = Math.sin(nextProgress * Math.PI) * 35;

          if (nextProgress >= 1.0) {
            // Intercept Detonation!
            audioEngine.playExplosion();

            // Check hit contact
            let hitContact: TacticalContact | null = null;
            simContactsRef.current = simContactsRef.current.filter((c) => {
              const d = Math.sqrt(Math.pow(c.lat - currentLat, 2) + Math.pow(c.lng - currentLng, 2));
              if (c.id === m.targetContactId || d < 0.4) {
                hitContact = c;
                return false;
              }
              return true;
            });

            if (hitContact) {
              onMissileInterceptRef.current(m, hitContact);
            }

            // Spawn explosion shockwave
            simExplosionsRef.current = [
              ...simExplosionsRef.current.slice(-(MAX_EXPLOSION_POOL - 1)),
              {
                id: `exp-${Date.now()}`,
                lat: currentLat,
                lng: currentLng,
                altKm: currentAlt,
                radiusKm: 15,
                maxRadiusKm: 15,
                durationSec: 1.8,
                elapsedSec: 0,
                color: '#10b981',
              },
            ];
          } else {
            const boundedTrajectory: [number, number, number][] = [
              ...m.trajectory.slice(-(MAX_TRAIL_POINTS - 1)),
              [currentLat, currentLng, currentAlt],
            ];

            survivingMissiles.push({
              ...m,
              flightProgress: nextProgress,
              currentLat,
              currentLng,
              currentAltKm: currentAlt,
              fuelPercent: Math.max(0, 100 - nextProgress * 100),
              trajectory: boundedTrajectory,
            });
          }
        }
        simMissilesRef.current = survivingMissiles;

        // 13. CONTINUOUS EXPLOSIONS DECAY
        simExplosionsRef.current = simExplosionsRef.current
          .map((e) => ({ ...e, elapsedSec: e.elapsedSec + deltaTime }))
          .filter((e) => e.elapsedSec < e.durationSec);

        // 14. UPDATE THREE.JS MESHES DIRECTLY IN-PLACE (ZERO ALLOCATIONS)
        const activeContacts = simContactsRef.current;
        const selectedCId = selectedContactIdRef.current;

        for (let i = 0; i < MAX_CONTACT_POOL; i++) {
          const mesh = contactMeshes[i];
          const lineGeom = contactLineGeoms[i];
          const lineMesh = contactLineMeshes[i];

          if (i < activeContacts.length) {
            const c = activeContacts[i];
            const p = geoToTheaterMapCoords(c.lat, c.lng, loc.lat, loc.lng);
            const isSel = selectedCId === c.id;

            mesh.visible = true;
            mesh.position.set(p.x, 0.4 + (c.altKm > 0 ? c.altKm * 0.08 : 0), p.z);
            mesh.userData = { contactId: c.id };

            if (c.status === 'UNKNOWN') {
              mesh.material = unknownMat;
              mesh.geometry = contactDiamondGeom;
              mesh.scale.set(0.9, 0.9, 1);
            } else if (c.status === 'CLASSIFYING') {
              mesh.material = classifyingMat;
              mesh.geometry = contactDiamondGeom;
              mesh.scale.set(1.1, 1.1, 1);
            } else {
              mesh.material = c.type.startsWith('FRIENDLY') ? friendlyMat : hostileMat;
              mesh.geometry = c.type.startsWith('FRIENDLY') ? contactCircleGeom : contactConeGeom;
              mesh.scale.set(isSel ? 1.4 : 1.0, isSel ? 1.4 : 1.0, 1);
            }

            // Trajectory Line
            if (c.status === 'HOSTILE' || isSel) {
              lineMesh.visible = true;
              const posAttr = lineGeom.getAttribute('position') as THREE.BufferAttribute;
              const pts = c.trajectoryPoints.slice(-MAX_TRAIL_POINTS);
              let idx = 0;

              for (const [tlat, tlng, talt] of pts) {
                const tp = geoToTheaterMapCoords(tlat, tlng, loc.lat, loc.lng);
                posAttr.setXYZ(idx++, tp.x, 0.3 + talt * 0.06, tp.z);
              }
              posAttr.setXYZ(idx++, 0, 0.3, 0); // connect to base
              lineGeom.setDrawRange(0, idx);
              posAttr.needsUpdate = true;
            } else {
              lineMesh.visible = false;
            }
          } else {
            mesh.visible = false;
            lineMesh.visible = false;
          }
        }

        // 15. UPDATE MISSILES POOL IN-PLACE
        const activeMissiles = simMissilesRef.current;
        for (let i = 0; i < MAX_MISSILE_POOL; i++) {
          const mesh = missileMeshes[i];
          const lineGeom = missileLineGeoms[i];
          const lineMesh = missileLineMeshes[i];

          if (i < activeMissiles.length) {
            const m = activeMissiles[i];
            const p = geoToTheaterMapCoords(m.currentLat, m.currentLng, loc.lat, loc.lng);

            mesh.visible = true;
            mesh.position.set(p.x, 0.5 + m.currentAltKm * 0.1, p.z);

            lineMesh.visible = true;
            const posAttr = lineGeom.getAttribute('position') as THREE.BufferAttribute;
            const pts = m.trajectory.slice(-MAX_TRAIL_POINTS);
            let idx = 0;

            for (const [mlat, mlng, malt] of pts) {
              const mp = geoToTheaterMapCoords(mlat, mlng, loc.lat, loc.lng);
              posAttr.setXYZ(idx++, mp.x, 0.4 + malt * 0.1, mp.z);
            }
            lineGeom.setDrawRange(0, idx);
            posAttr.needsUpdate = true;
          } else {
            mesh.visible = false;
            lineMesh.visible = false;
          }
        }

        // 16. UPDATE EXPLOSIONS POOL IN-PLACE
        const activeExp = simExplosionsRef.current;
        for (let i = 0; i < MAX_EXPLOSION_POOL; i++) {
          const mesh = explosionMeshes[i];
          if (i < activeExp.length) {
            const exp = activeExp[i];
            const p = geoToTheaterMapCoords(exp.lat, exp.lng, loc.lat, loc.lng);
            const scale = Math.max(0.2, (exp.elapsedSec / exp.durationSec) * 1.6);

            mesh.visible = true;
            mesh.position.set(p.x, 0.5, p.z);
            mesh.scale.set(scale, scale, 1);
            (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - exp.elapsedSec / exp.durationSec);
            (mesh.material as THREE.MeshBasicMaterial).color.set(exp.color === '#ef4444' ? 0xef4444 : 0x10b981);
          } else {
            mesh.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('click', handleClick);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />;
});

TacticalMap3D.displayName = 'TacticalMap3D';
