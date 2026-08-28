'use client';

import React, { useRef, useEffect, useCallback } from 'react';
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
  latLngToVector3,
  generateTacticalEarthTexture,
  createAtmosphereMesh,
  createStarfield,
} from '../utils/threeTactical';

interface WorldGlobe3DProps {
  location: GeoLocation;
  gameView: GameView;
  radarRange: RadarRange;
  contacts: TacticalContact[];
  missiles: TacticalMissile[];
  explosions: Explosion3D[];
  selectedContact: TacticalContact | null;
  trackedContactId: string | null;
  onSelectContact: (contact: TacticalContact) => void;
  onTransitionComplete?: () => void;
}

export const WorldGlobe3D: React.FC<WorldGlobe3DProps> = ({
  location,
  gameView,
  radarRange,
  contacts,
  missiles,
  explosions,
  selectedContact,
  trackedContactId,
  onSelectContact,
  onTransitionComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Scene & Engine Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Interactive camera state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ theta: 0, phi: Math.PI / 3 });
  const cameraDistanceRef = useRef(320);
  const targetDistanceRef = useRef(320);

  // Focus point on the globe
  const targetFocusVecRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentFocusVecRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Dynamic Objects Group Refs
  const radarGroupRef = useRef<THREE.Group | null>(null);
  const contactsGroupRef = useRef<THREE.Group | null>(null);
  const missilesGroupRef = useRef<THREE.Group | null>(null);
  const explosionsGroupRef = useRef<THREE.Group | null>(null);
  const trajectoriesGroupRef = useRef<THREE.Group | null>(null);

  // Sweep angle ref
  const sweepAngleRef = useRef(0);

  // Transition animation state
  const isTransitioningRef = useRef(false);
  const transitionProgressRef = useRef(0);

  // Helper to convert lat/lng of current location into standard unit vector
  const getLocationVector = useCallback((lat: number, lng: number, dist: number) => {
    const v = latLngToVector3(lat, lng, dist, 0);
    return v;
  }, []);

  // Update target focus based on gameView and location
  useEffect(() => {
    if (gameView === 'START') {
      targetDistanceRef.current = 300;
      targetFocusVecRef.current.set(0, 0, 0);
    } else if (gameView === 'TRANSITION') {
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0;
      targetDistanceRef.current = 150;
    } else if (gameView === 'THEATER') {
      targetDistanceRef.current = 150;
      const targetPos = latLngToVector3(location.lat, location.lng, GLOBE_RADIUS, 0);
      targetFocusVecRef.current.copy(targetPos);
    }
  }, [gameView, location]);

  // Main Three.js Scene Setup Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Setup Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 3000);
    camera.position.set(0, 80, 320);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Add Starfield & Lighting
    const starfield = createStarfield();
    scene.add(starfield);

    const ambientLight = new THREE.AmbientLight(0x0f2420, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xdcfce7, 2.0);
    sunLight.position.set(200, 150, 300);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.4);
    rimLight.position.set(-200, -100, -200);
    scene.add(rimLight);

    // 3. Add 3D Globe with Tactical Satellite Texture
    const earthTexture = generateTacticalEarthTexture();
    const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.25,
      emissive: new THREE.Color(0x021810),
      emissiveIntensity: 0.35,
    });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globeMesh);

    // Add Atmospheric Rim Glow
    const atmosphere = createAtmosphereMesh();
    scene.add(atmosphere);

    // 4. Create Dynamic Object Groups
    const radarGroup = new THREE.Group();
    scene.add(radarGroup);
    radarGroupRef.current = radarGroup;

    const contactsGroup = new THREE.Group();
    scene.add(contactsGroup);
    contactsGroupRef.current = contactsGroup;

    const missilesGroup = new THREE.Group();
    scene.add(missilesGroup);
    missilesGroupRef.current = missilesGroup;

    const trajectoriesGroup = new THREE.Group();
    scene.add(trajectoriesGroup);
    trajectoriesGroupRef.current = trajectoriesGroup;

    const explosionsGroup = new THREE.Group();
    scene.add(explosionsGroup);
    explosionsGroupRef.current = explosionsGroup;

    // 5. Mouse Orbit / Drag / Zoom Listeners
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraRotationRef.current.theta -= deltaX * 0.005;
      cameraRotationRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotationRef.current.phi - deltaY * 0.005));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDistanceRef.current = Math.max(120, Math.min(500, targetDistanceRef.current + e.deltaY * 0.2));
    };

    // Raycast click detection for 3D contacts
    const handleClick = (e: MouseEvent) => {
      if (!container || !cameraRef.current) return;
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
          const hitObj = intersects[0].object;
          const contactId = hitObj.userData?.contactId;
          if (contactId) {
            const found = contacts.find((c) => c.id === contactId);
            if (found) {
              onSelectContact(found);
            }
          }
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });
    domElem.addEventListener('click', handleClick);

    // 6. Handle Window Resize
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop (60 FPS)
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth camera distance interpolation
      cameraDistanceRef.current += (targetDistanceRef.current - cameraDistanceRef.current) * 0.08;

      // Handle Transitions & Orbit
      if (gameView === 'START') {
        // Slow auto-rotation in start screen
        cameraRotationRef.current.theta += 0.0015;
      } else if (isTransitioningRef.current) {
        transitionProgressRef.current += 0.015;
        if (transitionProgressRef.current >= 1.0) {
          isTransitioningRef.current = false;
          onTransitionComplete?.();
        }
      }

      // Smooth focus position tracking
      currentFocusVecRef.current.lerp(targetFocusVecRef.current, 0.05);

      // Compute camera 3D coordinates based on spherical rotation
      const theta = cameraRotationRef.current.theta;
      const phi = cameraRotationRef.current.phi;
      const dist = cameraDistanceRef.current;

      const cx = currentFocusVecRef.current.x + dist * Math.sin(phi) * Math.sin(theta);
      const cy = currentFocusVecRef.current.y + dist * Math.cos(phi);
      const cz = currentFocusVecRef.current.z + dist * Math.sin(phi) * Math.cos(theta);

      camera.position.set(cx, cy, cz);
      camera.lookAt(currentFocusVecRef.current);

      // Rotate radar sweep beam
      sweepAngleRef.current = (sweepAngleRef.current + 0.03) % (Math.PI * 2);

      // Render Three.js Scene
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElem.removeEventListener('wheel', handleWheel);
      domElem.removeEventListener('click', handleClick);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [contacts, gameView, getLocationVector, location, onSelectContact, onTransitionComplete]);

  // Update Radar Visuals on the Globe
  useEffect(() => {
    const radarGroup = radarGroupRef.current;
    if (!radarGroup) return;

    // Clear previous radar meshes
    while (radarGroup.children.length > 0) {
      const child = radarGroup.children[0];
      radarGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    if (gameView === 'START') return;

    // Center of player's location
    const centerVec = latLngToVector3(location.lat, location.lng, GLOBE_RADIUS, 0.2);

    // 1. Concentric Range Rings (50km, 100km, 250km, 500km)
    const ringRanges = [50, 100, 250, 500];
    ringRanges.forEach((rangeKm) => {
      if (rangeKm > radarRange) return;
      const ringRadius = (rangeKm / 500) * 14; // scaled visual radius on sphere
      const ringGeom = new THREE.RingGeometry(ringRadius - 0.2, ringRadius, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: rangeKm === radarRange ? 0.6 : 0.25,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(centerVec);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0)); // align tangent to globe surface
      radarGroup.add(ringMesh);
    });

    // 2. Rotating Radar Sweep Beam Wedge
    const sweepRadius = (radarRange / 500) * 14;
    const sweepGeom = new THREE.CircleGeometry(sweepRadius, 32, 0, Math.PI / 4);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const sweepMesh = new THREE.Mesh(sweepGeom, sweepMat);
    sweepMesh.position.copy(centerVec);
    sweepMesh.lookAt(new THREE.Vector3(0, 0, 0));
    radarGroup.add(sweepMesh);

    // 3. Location Beacon Light Marker
    const beaconGeom = new THREE.SphereGeometry(0.8, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
    beaconMesh.position.copy(centerVec);
    radarGroup.add(beaconMesh);
  }, [location, radarRange, gameView]);

  // Update Contacts & Markers on the Globe
  useEffect(() => {
    const contactsGroup = contactsGroupRef.current;
    const trajectoriesGroup = trajectoriesGroupRef.current;
    if (!contactsGroup || !trajectoriesGroup) return;

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

    contacts.forEach((contact) => {
      const pos = latLngToVector3(contact.lat, contact.lng, GLOBE_RADIUS, contact.altKm);
      const isSelected = selectedContact?.id === contact.id;

      // Contact Color based on Status & Type
      let colorHex = 0xef4444; // Hostile Red
      if (contact.status === 'UNKNOWN') colorHex = 0xf59e0b; // Amber Unknown
      if (contact.status === 'CLASSIFYING') colorHex = 0x38bdf8; // Cyan Classifying
      if (contact.type.startsWith('FRIENDLY')) colorHex = 0x10b981; // Green Friendly

      // 3D Contact Marker Mesh
      const size = isSelected ? 1.6 : 1.1;
      const geom = contact.type === 'HOSTILE_BALLISTIC'
        ? new THREE.ConeGeometry(size * 0.8, size * 2.2, 8)
        : new THREE.SphereGeometry(size, 16, 16);

      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.userData = { contactId: contact.id };

      // Orient cone towards target
      if (contact.type === 'HOSTILE_BALLISTIC') {
        const targetPos = latLngToVector3(contact.targetLat, contact.targetLng, GLOBE_RADIUS, 0);
        mesh.lookAt(targetPos);
        mesh.rotateX(Math.PI / 2);
      }

      contactsGroup.add(mesh);

      // Trajectory Line
      if (contact.trajectoryPoints.length > 1) {
        const points = contact.trajectoryPoints.map(([lat, lng, alt]) => latLngToVector3(lat, lng, GLOBE_RADIUS, alt));
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: isSelected ? 0.8 : 0.35,
          linewidth: isSelected ? 2 : 1,
        });
        const line = new THREE.Line(lineGeom, lineMat);
        trajectoriesGroup.add(line);
      }
    });
  }, [contacts, selectedContact]);

  // Update Missiles & Trajectories
  useEffect(() => {
    const missilesGroup = missilesGroupRef.current;
    if (!missilesGroup) return;

    while (missilesGroup.children.length > 0) {
      const child = missilesGroup.children[0];
      missilesGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    missiles.forEach((m) => {
      const pos = latLngToVector3(m.currentLat, m.currentLng, GLOBE_RADIUS, m.currentAltKm);
      const geom = new THREE.SphereGeometry(0.8, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      missilesGroup.add(mesh);

      // Trajectory Trail
      if (m.trajectory.length > 1) {
        const points = m.trajectory.map(([lat, lng, alt]) => latLngToVector3(lat, lng, GLOBE_RADIUS, alt));
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 });
        const line = new THREE.Line(lineGeom, lineMat);
        missilesGroup.add(line);
      }
    });
  }, [missiles]);

  // Update 3D Explosions
  useEffect(() => {
    const explosionsGroup = explosionsGroupRef.current;
    if (!explosionsGroup) return;

    while (explosionsGroup.children.length > 0) {
      const child = explosionsGroup.children[0];
      explosionsGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }

    explosions.forEach((exp) => {
      const pos = latLngToVector3(exp.lat, exp.lng, GLOBE_RADIUS, exp.altKm);
      const geom = new THREE.SphereGeometry(exp.radiusKm * 0.4, 24, 24);
      const mat = new THREE.MeshBasicMaterial({
        color: exp.color === '#ef4444' ? 0xef4444 : 0x10b981,
        transparent: true,
        opacity: Math.max(0, 1 - exp.elapsedSec / exp.durationSec),
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      explosionsGroup.add(mesh);
    });
  }, [explosions]);

  return <div ref={mountRef} className="w-full h-full absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />;
};
