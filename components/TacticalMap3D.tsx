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
  latLngToVector3,
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

  // High-performance mutable simulation state (Zero React re-renders per frame)
  const contactsRef = useRef<TacticalContact[]>(contacts);
  contactsRef.current = contacts;

  const missilesRef = useRef<TacticalMissile[]>(missiles);
  missilesRef.current = missiles;

  const explosionsRef = useRef<Explosion3D[]>(explosions);
  explosionsRef.current = explosions;

  const locationRef = useRef<GeoLocation>(location);
  locationRef.current = location;

  const radarRangeRef = useRef<RadarRange>(radarRange);
  radarRangeRef.current = radarRange;

  const selectedContactRef = useRef<TacticalContact | null>(selectedContact);
  selectedContactRef.current = selectedContact;

  // Scene & Engine Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Camera Pan / Zoom state
  const isDraggingRef = useRef(false);
  const isRightClickRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraPanOffsetRef = useRef({ x: 0, z: 0 });
  const cameraZoomRef = useRef(140); // Camera height above theater map
  const targetCameraZoomRef = useRef(140);

  // Transition state
  const transitionProgressRef = useRef(0);
  const isTransitioningRef = useRef(false);

  // Three.js Scene Groups
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const theaterMapGroupRef = useRef<THREE.Group | null>(null);
  const radarOverlayGroupRef = useRef<THREE.Group | null>(null);
  const contactsGroupRef = useRef<THREE.Group | null>(null);
  const trajectoriesGroupRef = useRef<THREE.Group | null>(null);
  const missilesGroupRef = useRef<THREE.Group | null>(null);
  const explosionsGroupRef = useRef<THREE.Group | null>(null);

  // Radar sweep angle
  const sweepAngleRef = useRef(0);

  // Handle GameView transitions
  useEffect(() => {
    if (gameView === 'START') {
      if (globeGroupRef.current) globeGroupRef.current.visible = true;
      if (theaterMapGroupRef.current) theaterMapGroupRef.current.visible = false;
      targetCameraZoomRef.current = 300;
      cameraPanOffsetRef.current = { x: 0, z: 0 };
    } else if (gameView === 'TRANSITION') {
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0;
      targetCameraZoomRef.current = 135;
    } else if (gameView === 'THEATER') {
      if (globeGroupRef.current) globeGroupRef.current.visible = false;
      if (theaterMapGroupRef.current) theaterMapGroupRef.current.visible = true;
      targetCameraZoomRef.current = 135;
    }
  }, [gameView]);

  // Main Three.js Scene Setup Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Setup Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
    camera.position.set(0, 300, 180);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Add Lighting & Starfield
    const starfield = createStarfield();
    scene.add(starfield);

    const ambientLight = new THREE.AmbientLight(0x102820, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xdcfce7, 1.8);
    sunLight.position.set(100, 200, 150);
    scene.add(sunLight);

    // 3. START SCREEN: 3D Earth Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const earthTexture = generateTacticalEarthTexture();
    const globeGeom = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48);
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
    theaterMapGroupRef.current = theaterMapGroup;

    // Large Geographic Terrain Plane
    const mapTexture = generateRegionalTacticalMapTexture(locationRef.current);
    const mapGeom = new THREE.PlaneGeometry(THEATER_MAP_SIZE, THEATER_MAP_SIZE);
    const mapMat = new THREE.MeshStandardMaterial({
      map: mapTexture,
      roughness: 0.8,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const mapMesh = new THREE.Mesh(mapGeom, mapMat);
    mapMesh.rotation.x = -Math.PI / 2; // Flat on X-Z ground
    mapMesh.position.set(0, 0, 0);
    theaterMapGroup.add(mapMesh);

    // Central Base Marker
    const baseGeom = new THREE.RingGeometry(1.2, 2.0, 16);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.set(0, 0.4, 0);
    theaterMapGroup.add(baseMesh);

    // 5. Tactical Radar Overlay Group (Compact ~20-25% of Viewport)
    const radarOverlayGroup = new THREE.Group();
    theaterMapGroup.add(radarOverlayGroup);
    radarOverlayGroupRef.current = radarOverlayGroup;

    // 6. Entity & Effects Groups
    const contactsGroup = new THREE.Group();
    theaterMapGroup.add(contactsGroup);
    contactsGroupRef.current = contactsGroup;

    const trajectoriesGroup = new THREE.Group();
    theaterMapGroup.add(trajectoriesGroup);
    trajectoriesGroupRef.current = trajectoriesGroup;

    const missilesGroup = new THREE.Group();
    theaterMapGroup.add(missilesGroup);
    missilesGroupRef.current = missilesGroup;

    const explosionsGroup = new THREE.Group();
    theaterMapGroup.add(explosionsGroup);
    explosionsGroupRef.current = explosionsGroup;

    // 7. Mouse Pan / Zoom / Drag Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      isRightClickRef.current = e.button === 2 || e.button === 1;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      if (gameView === 'THEATER') {
        // Pan the geographic map
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
      targetCameraZoomRef.current = Math.max(60, Math.min(260, targetCameraZoomRef.current + e.deltaY * 0.15));
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Raycast contact selection
    const handleClick = (e: MouseEvent) => {
      if (!container || !cameraRef.current || gameView !== 'THEATER') return;
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / container.clientWidth) * 2 - 1,
        -((e.clientY - rect.top) / container.clientHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      if (contactsGroupRef.current) {
        const intersects = raycaster.intersectObjects(contactsGroupRef.current.children, true);
        if (intersects.length > 0) {
          const contactId = intersects[0].object.userData?.contactId;
          if (contactId) {
            const found = contactsRef.current.find((c) => c.id === contactId);
            if (found) {
              onSelectContact(found);
            }
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('contextmenu', handleContextMenu);
    dom.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. 60 FPS ULTRA-OPTIMIZED RENDER & SIMULATION LOOP
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth zoom damping
      cameraZoomRef.current += (targetCameraZoomRef.current - cameraZoomRef.current) * 0.08;

      if (gameView === 'START') {
        // Slowly rotate globe in space
        if (globeMesh) globeMesh.rotation.y += 0.0012;
        camera.position.set(0, 70, cameraZoomRef.current);
        camera.lookAt(0, 0, 0);
      } else if (isTransitioningRef.current) {
        // Smooth cinematic descent
        transitionProgressRef.current += 0.02;
        const p = Math.min(1.0, transitionProgressRef.current);

        // Interpolate from Orbit (0, 70, 300) to Tactical Overhead (0, 135, 70)
        camera.position.set(0, THREE.MathUtils.lerp(70, 135, p), THREE.MathUtils.lerp(300, 70, p));
        camera.lookAt(0, 0, 0);

        if (p >= 1.0) {
          isTransitioningRef.current = false;
          if (globeGroupRef.current) globeGroupRef.current.visible = false;
          if (theaterMapGroupRef.current) theaterMapGroupRef.current.visible = true;
          onTransitionComplete?.();
        }
      } else if (gameView === 'THEATER') {
        // Focused on Tactical Geographic Map
        const pan = cameraPanOffsetRef.current;
        const zoom = cameraZoomRef.current;

        // Position camera slightly tilted for depth over the geographic map
        camera.position.set(pan.x, zoom, pan.z + zoom * 0.45);
        camera.lookAt(pan.x, 0, pan.z);

        // Update radar sweep angle
        sweepAngleRef.current = (sweepAngleRef.current + 0.035) % (Math.PI * 2);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('contextmenu', handleContextMenu);
      dom.removeEventListener('click', handleClick);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gameView, onContactImpact, onMissileDetonated, onSelectContact, onTransitionComplete]);

  // Update Compact Radar Overlay Meshes (Small ~20-25% of Viewport)
  useEffect(() => {
    const radarGroup = radarOverlayGroupRef.current;
    if (!radarGroup || gameView !== 'THEATER') return;

    while (radarGroup.children.length > 0) {
      const child = radarGroup.children[0];
      radarGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    // Small radar visual radius (approx 20-30 units on a 400-unit map)
    const baseRadius = (radarRange / 500) * 32;

    // 1. Concentric Range Rings (Thin, Subtle)
    const steps = [0.25, 0.5, 0.75, 1.0];
    steps.forEach((fraction) => {
      const r = baseRadius * fraction;
      const ringGeom = new THREE.RingGeometry(r - 0.15, r, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: fraction === 1.0 ? 0.5 : 0.2,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(0, 0.25, 0);
      radarGroup.add(ringMesh);
    });

    // 2. Rotating Radar Sweep Beam Wedge (Subtle)
    const sweepGeom = new THREE.CircleGeometry(baseRadius, 24, 0, Math.PI / 5);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const sweepMesh = new THREE.Mesh(sweepGeom, sweepMat);
    sweepMesh.rotation.x = -Math.PI / 2;
    sweepMesh.position.set(0, 0.22, 0);
    radarGroup.add(sweepMesh);
  }, [gameView, radarRange]);

  // Update Contacts on Map (Small, Subtle Tactical Visuals)
  useEffect(() => {
    const contactsGroup = contactsGroupRef.current;
    const trajectoriesGroup = trajectoriesGroupRef.current;
    if (!contactsGroup || !trajectoriesGroup || gameView !== 'THEATER') return;

    while (contactsGroup.children.length > 0) {
      const child = contactsGroup.children[0];
      contactsGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    while (trajectoriesGroup.children.length > 0) {
      const child = trajectoriesGroup.children[0];
      trajectoriesGroup.remove(child);
      if ((child as THREE.Line).geometry) (child as THREE.Line).geometry.dispose();
    }

    const loc = locationRef.current;

    contacts.forEach((contact) => {
      // Convert real-world Lat/Lng to planar 3D coords relative to base
      const pos = geoToTheaterMapCoords(contact.lat, contact.lng, loc.lat, loc.lng);
      const isSelected = selectedContact?.id === contact.id;

      // Contact Color
      let colorHex = 0xef4444; // Hostile Red
      if (contact.status === 'UNKNOWN') colorHex = 0xf59e0b; // Amber Unknown
      if (contact.status === 'CLASSIFYING') colorHex = 0x38bdf8; // Cyan Classifying
      if (contact.type.startsWith('FRIENDLY')) colorHex = 0x10b981; // Green Friendly

      // Small, subtle marker geometry
      const size = isSelected ? 1.4 : 0.9;
      let geom: THREE.BufferGeometry;

      if (contact.status === 'UNKNOWN') {
        // Diamond ◇
        geom = new THREE.RingGeometry(size * 0.7, size, 4);
      } else if (contact.type === 'HOSTILE_BALLISTIC') {
        // Sharp tactical marker
        geom = new THREE.ConeGeometry(size * 0.8, size * 1.8, 6);
      } else {
        // Small cross / circle
        geom = new THREE.CircleGeometry(size, 8);
      }

      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: contact.status === 'UNKNOWN' ? 0.6 : 0.95,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pos.x, 0.4 + (contact.altKm > 0 ? contact.altKm * 0.08 : 0), pos.z);
      mesh.userData = { contactId: contact.id };
      contactsGroup.add(mesh);

      // Thin Predicted Trajectory Line
      if (contact.status === 'HOSTILE' || isSelected) {
        const linePoints = [
          new THREE.Vector3(pos.x, 0.3, pos.z),
          new THREE.Vector3(0, 0.3, 0), // Lead line to central base
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
        const lineMat = new THREE.LineDashedMaterial({
          color: colorHex,
          dashSize: 2,
          gapSize: 2,
          transparent: true,
          opacity: isSelected ? 0.8 : 0.25,
        });
        const line = new THREE.Line(lineGeom, lineMat);
        line.computeLineDistances();
        trajectoriesGroup.add(line);
      }
    });
  }, [contacts, gameView, selectedContact]);

  // Update Missiles on Map (Thin, Elegant Flight Streaks)
  useEffect(() => {
    const missilesGroup = missilesGroupRef.current;
    if (!missilesGroup || gameView !== 'THEATER') return;

    while (missilesGroup.children.length > 0) {
      const child = missilesGroup.children[0];
      missilesGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    const loc = locationRef.current;

    missiles.forEach((m) => {
      const pos = geoToTheaterMapCoords(m.currentLat, m.currentLng, loc.lat, loc.lng);
      const geom = new THREE.SphereGeometry(0.7, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(pos.x, 0.5 + m.currentAltKm * 0.1, pos.z);
      missilesGroup.add(mesh);

      // Thin streak
      const sourcePos = geoToTheaterMapCoords(m.sourceLat, m.sourceLng, loc.lat, loc.lng);
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sourcePos.x, 0.3, sourcePos.z),
        new THREE.Vector3(pos.x, 0.3 + m.currentAltKm * 0.1, pos.z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
      const line = new THREE.Line(lineGeom, lineMat);
      missilesGroup.add(line);
    });
  }, [missiles, gameView]);

  // Update Explosions on Map (Small shockwave rings)
  useEffect(() => {
    const explosionsGroup = explosionsGroupRef.current;
    if (!explosionsGroup || gameView !== 'THEATER') return;

    while (explosionsGroup.children.length > 0) {
      const child = explosionsGroup.children[0];
      explosionsGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    const loc = locationRef.current;

    explosions.forEach((exp) => {
      const pos = geoToTheaterMapCoords(exp.lat, exp.lng, loc.lat, loc.lng);
      const radius = Math.max(1, exp.radiusKm * 0.45);
      const geom = new THREE.RingGeometry(radius - 0.4, radius, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: exp.color === '#ef4444' ? 0xef4444 : 0x10b981,
        transparent: true,
        opacity: Math.max(0, 1 - exp.elapsedSec / exp.durationSec),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pos.x, 0.5, pos.z);
      explosionsGroup.add(mesh);
    });
  }, [explosions, gameView]);

  return <div ref={mountRef} className="w-full h-full absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />;
};
