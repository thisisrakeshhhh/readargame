'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import {
  GeoLocation,
  TacticalContact,
  TacticalMissile,
  Explosion3D,
  RadarRange,
  GameView,
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

interface TacticalMap3DProps {
  location: GeoLocation;
  gameView: GameView;
  radarRange: RadarRange;
  contacts: TacticalContact[];
  missiles: TacticalMissile[];
  explosions: Explosion3D[];
  selectedContact: TacticalContact | null;
  trackedContactId: string | null;
  onSelectContact: (contact: TacticalContact) => void;
  onContactImpact: (contact: TacticalContact) => void;
  onMissileDetonated: (missile: TacticalMissile, hitContact: TacticalContact | null) => void;
  onTransitionComplete?: () => void;
}

const MAX_CONTACT_POOL = 30;
const MAX_MISSILE_POOL = 10;
const MAX_EXPLOSION_POOL = 10;
const MAX_TRAIL_POINTS = 40;

// Texture cache to prevent repeated canvas generation
const mapTextureCache: Record<string, THREE.CanvasTexture> = {};

export const TacticalMap3D: React.FC<TacticalMap3DProps> = ({
  location,
  gameView,
  radarRange,
  contacts,
  missiles,
  explosions,
  selectedContact,
  trackedContactId,
  onSelectContact,
  onContactImpact,
  onMissileDetonated,
  onTransitionComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 1. STABLE REFS FOR ALL INCOMING PROPS & CALLBACKS (Prevents any Three.js reconstruction)
  const locationRef = useRef(location);
  locationRef.current = location;

  const gameViewRef = useRef(gameView);
  gameViewRef.current = gameView;

  const radarRangeRef = useRef(radarRange);
  radarRangeRef.current = radarRange;

  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;

  const missilesRef = useRef(missiles);
  missilesRef.current = missiles;

  const explosionsRef = useRef(explosions);
  explosionsRef.current = explosions;

  const selectedContactRef = useRef(selectedContact);
  selectedContactRef.current = selectedContact;

  const trackedContactIdRef = useRef(trackedContactId);
  trackedContactIdRef.current = trackedContactId;

  const onSelectContactRef = useRef(onSelectContact);
  onSelectContactRef.current = onSelectContact;

  const onContactImpactRef = useRef(onContactImpact);
  onContactImpactRef.current = onContactImpact;

  const onMissileDetonatedRef = useRef(onMissileDetonated);
  onMissileDetonatedRef.current = onMissileDetonated;

  const onTransitionCompleteRef = useRef(onTransitionComplete);
  onTransitionCompleteRef.current = onTransitionComplete;

  // Camera & Interaction Refs
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraPanOffsetRef = useRef({ x: 0, z: 0 });
  const cameraZoomRef = useRef(140);
  const targetCameraZoomRef = useRef(140);
  const isTransitioningRef = useRef(false);
  const transitionProgressRef = useRef(0);

  // THREE.JS SCENE INITIALIZATION (RUNS ONCE ON MOUNT)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;

    // 1. Create Single Scene, Camera & Renderer
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
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);

    // 2. Starfield & Lighting
    const starfield = createStarfield();
    scene.add(starfield);

    const ambientLight = new THREE.AmbientLight(0x102820, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xdcfce7, 1.8);
    sunLight.position.set(100, 200, 150);
    scene.add(sunLight);

    // 3. START SCREEN: 3D Earth Globe Group (Low Poly 32x24 for performance)
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

    // 4. THEATER GAMEPLAY: Dark Geographic Map Group (75-85% of Viewport)
    const theaterMapGroup = new THREE.Group();
    theaterMapGroup.visible = false;
    scene.add(theaterMapGroup);

    // Geographic Terrain Plane
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

    // 6. PRE-ALLOCATED CONTACTS OBJECT POOL (ZERO PER-FRAME ALLOCATIONS)
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

      // Pre-allocated Line Buffer for trajectories (max 40 points)
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

    // 9. MOUSE PAN / ZOOM HANDLERS (Direct event-based, Zero React re-renders)
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

    // Raycast contact selection
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
          const found = contactsRef.current.find((c) => c.id === cid);
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

    // 10. SINGLE REQUEST-ANIMATION-FRAME LOOP (ZERO ALLOCATIONS)
    let animId: number;
    let sweepAngle = 0;

    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      // Pause high-frequency rendering when tab is hidden
      if (document.hidden) return;

      const currentView = gameViewRef.current;
      const loc = locationRef.current;

      // Smooth zoom damping
      cameraZoomRef.current += (targetCameraZoomRef.current - cameraZoomRef.current) * 0.08;

      if (currentView === 'START') {
        globeGroup.visible = true;
        theaterMapGroup.visible = false;
        starfield.visible = true;

        globeMesh.rotation.y += 0.001;
        camera.position.set(0, 60, cameraZoomRef.current);
        camera.lookAt(0, 0, 0);
      } else if (currentView === 'TRANSITION') {
        globeGroup.visible = true;
        theaterMapGroup.visible = true;
        starfield.visible = true;

        transitionProgressRef.current += 0.02;
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

        // Update Radar Sweep
        sweepAngle = (sweepAngle + 0.035) % (Math.PI * 2);
        sweepMesh.rotation.z = sweepAngle;

        // Scale Radar Overlay based on current range
        const rangeFraction = radarRangeRef.current / 500;
        const activeRadarRadius = rangeFraction * 24;
        sweepMesh.scale.set(rangeFraction, rangeFraction, 1);
        ringMeshes.forEach((rm, i) => {
          rm.visible = (i + 1) * 125 <= radarRangeRef.current + 25;
        });

        // 11. UPDATE CONTACTS POOL IN-PLACE (ZERO ALLOCATIONS)
        const currentContacts = contactsRef.current;
        const selectedC = selectedContactRef.current;

        for (let i = 0; i < MAX_CONTACT_POOL; i++) {
          const mesh = contactMeshes[i];
          const lineGeom = contactLineGeoms[i];
          const lineMesh = contactLineMeshes[i];

          if (i < currentContacts.length) {
            const c = currentContacts[i];
            const p = geoToTheaterMapCoords(c.lat, c.lng, loc.lat, loc.lng);
            const isSel = selectedC?.id === c.id;

            mesh.visible = true;
            mesh.position.set(p.x, 0.4 + (c.altKm > 0 ? c.altKm * 0.08 : 0), p.z);
            mesh.userData = { contactId: c.id };

            // Material & Geometry based on status
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

            // Update Trajectory Line in-place
            if (c.status === 'HOSTILE' || isSel) {
              lineMesh.visible = true;
              const posAttr = lineGeom.getAttribute('position') as THREE.BufferAttribute;
              const pts = c.trajectoryPoints.slice(-MAX_TRAIL_POINTS);
              let idx = 0;

              for (const [tlat, tlng, talt] of pts) {
                const tp = geoToTheaterMapCoords(tlat, tlng, loc.lat, loc.lng);
                posAttr.setXYZ(idx++, tp.x, 0.3 + talt * 0.06, tp.z);
              }
              // Connect lead to target base
              posAttr.setXYZ(idx++, 0, 0.3, 0);

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

        // 12. UPDATE MISSILES POOL IN-PLACE
        const currentMissiles = missilesRef.current;
        for (let i = 0; i < MAX_MISSILE_POOL; i++) {
          const mesh = missileMeshes[i];
          const lineGeom = missileLineGeoms[i];
          const lineMesh = missileLineMeshes[i];

          if (i < currentMissiles.length) {
            const m = currentMissiles[i];
            const p = geoToTheaterMapCoords(m.currentLat, m.currentLng, loc.lat, loc.lng);

            mesh.visible = true;
            mesh.position.set(p.x, 0.5 + m.currentAltKm * 0.1, p.z);

            // Update trail line
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

        // 13. UPDATE EXPLOSIONS POOL IN-PLACE
        const currentExp = explosionsRef.current;
        for (let i = 0; i < MAX_EXPLOSION_POOL; i++) {
          const mesh = explosionMeshes[i];
          if (i < currentExp.length) {
            const exp = currentExp[i];
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

    animate();

    // CLEANUP ON TRUE UNMOUNT ONLY
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
  }, []); // EMPTY DEPENDENCIES — INITIALIZES ONCE PER MOUNT!

  return <div ref={mountRef} className="w-full h-full absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />;
};
