import * as THREE from 'three';
import { GeoLocation } from '../types/tactical';

export const GLOBE_RADIUS = 100;
export const THEATER_MAP_SIZE = 400; // Units representing ~1000km theater map area

/**
 * Converts Latitude, Longitude and Altitude into 3D Globe Coordinates
 */
export function latLngToVector3(lat: number, lng: number, radius: number = GLOBE_RADIUS, altKm: number = 0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = radius + (altKm > 0 ? altKm * 0.12 : 0.2);
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Converts real-world Lat/Lng delta relative to base location into Flat Tactical Map 3D Coordinates (X, Y, Z)
 */
export function geoToTheaterMapCoords(
  targetLat: number,
  targetLng: number,
  baseLat: number,
  baseLng: number,
  scale: number = 18 // 1 degree ≈ 18 units
): THREE.Vector3 {
  const dx = (targetLng - baseLng) * scale * Math.cos(baseLat * (Math.PI / 180));
  const dz = -(targetLat - baseLat) * scale;
  return new THREE.Vector3(dx, 0.2, dz);
}

/**
 * Creates high-detail procedural tactical geographic terrain texture for the selected theater
 */
export function generateRegionalTacticalMapTexture(location: GeoLocation): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Deep Dark Topographic Base
  ctx.fillStyle = '#040d12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Tactical Elevation Grid Lines
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.06)';
  ctx.lineWidth = 1;
  const gridStep = canvas.width / 32;

  for (let x = 0; x <= canvas.width; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Major Sector Grid Lines
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.12)';
  ctx.lineWidth = 2;
  const majorStep = canvas.width / 4;
  for (let x = 0; x <= canvas.width; x += majorStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += majorStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 3. Simulated Topographic Contours & Coastlines
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
  ctx.lineWidth = 1.5;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Regional terrain contour shapes
  for (let r = 200; r <= 800; r += 120) {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2; a += 0.2) {
      const wobble = Math.sin(a * 5) * 25 + Math.cos(a * 3) * 35;
      const x = cx + Math.cos(a) * (r + wobble);
      const y = cy + Math.sin(a) * (r + wobble);
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 4. City Dots & Regional Sectors
  ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`THEATER: ${location.name.toUpperCase()} / ${location.country.toUpperCase()}`, 60, 80);
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(52, 211, 153, 0.5)';
  ctx.fillText(`GRID REF: ${location.countryCode}-${Math.abs(Math.round(location.lat))}-${Math.abs(Math.round(location.lng))}`, 60, 110);
  ctx.fillText(`SCALE: 1:500,000 STRATEGIC DEFENSE SECTOR`, 60, 135);

  // Neighboring City Markers
  const subCities = [
    { name: 'SEC-ALPHA', dx: -350, dy: -250 },
    { name: 'SEC-BRAVO', dx: 380, dy: -180 },
    { name: 'SEC-CHARLIE', dx: -280, dy: 340 },
    { name: 'SEC-DELTA', dx: 320, dy: 310 },
    { name: 'OUTPOST-9', dx: -480, dy: 80 },
    { name: 'AIRBASE-4', dx: 450, dy: -420 },
  ];

  subCities.forEach((city) => {
    const px = cx + city.dx;
    const py = cy + city.dy;

    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(52, 211, 153, 0.7)';
    ctx.font = '12px monospace';
    ctx.fillText(city.name, px + 12, py + 4);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates 3D Earth globe texture for Start Screen
 */
export function generateTacticalEarthTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#03080d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += canvas.width / 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += canvas.height / 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#0b1b24';
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
  ctx.lineWidth = 2;

  // Simple stylized landmasses
  const drawPoly = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([nx, ny], i) => {
      const x = nx * canvas.width;
      const y = ny * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  drawPoly([[0.1, 0.2], [0.35, 0.25], [0.3, 0.45], [0.15, 0.5], [0.08, 0.35]]); // North America
  drawPoly([[0.25, 0.52], [0.38, 0.55], [0.32, 0.85], [0.22, 0.7]]); // South America
  drawPoly([[0.45, 0.2], [0.6, 0.2], [0.55, 0.4], [0.42, 0.38]]); // Europe
  drawPoly([[0.45, 0.42], [0.62, 0.42], [0.58, 0.75], [0.46, 0.7]]); // Africa
  drawPoly([[0.6, 0.18], [0.88, 0.2], [0.82, 0.5], [0.62, 0.45]]); // Asia
  drawPoly([[0.75, 0.65], [0.88, 0.65], [0.85, 0.85], [0.72, 0.8]]); // Australia

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates atmospheric glow mesh around the Earth for Start Screen
 */
export function createAtmosphereMesh(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 32, 32);
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(0.05, 0.75, 0.55, 1.0) * intensity * 0.8;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
  });

  return new THREE.Mesh(geometry, material);
}

/**
 * Creates starry deep space backdrop
 */
export function createStarfield(): THREE.Points {
  const starCount = 800;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const radius = 500 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 2.0,
    color: 0x6ee7b7,
    transparent: true,
    opacity: 0.6,
  });

  return new THREE.Points(geometry, material);
}
