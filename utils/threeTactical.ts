import * as THREE from 'three';

export const GLOBE_RADIUS = 100;

/**
 * Converts Latitude, Longitude and Altitude into 3D Vector coordinates
 */
export function latLngToVector3(lat: number, lng: number, radius: number = GLOBE_RADIUS, altKm: number = 0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = radius + (altKm > 0 ? altKm * 0.15 : 0.4);
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/**
 * Converts 3D Vector coordinates back to Latitude and Longitude
 */
export function vector3ToLatLng(v: THREE.Vector3): { lat: number; lng: number } {
  const norm = v.clone().normalize();
  const lat = 90 - Math.acos(norm.y) * (180 / Math.PI);
  const lng = ((270 - Math.atan2(norm.z, -norm.x) * (180 / Math.PI)) % 360) - 180;
  return { lat, lng };
}

/**
 * Generates an elevated 3D ballistic arc curve between two lat/lng coordinates
 */
export function createBallisticCurve(
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
  apexAltKm: number = 60
): THREE.QuadraticBezierCurve3 {
  const p1 = latLngToVector3(originLat, originLng, GLOBE_RADIUS, 1);
  const p3 = latLngToVector3(targetLat, targetLng, GLOBE_RADIUS, 1);

  // Midpoint with elevated altitude
  const midLat = (originLat + targetLat) / 2;
  const midLng = (originLng + targetLng) / 2;
  const p2 = latLngToVector3(midLat, midLng, GLOBE_RADIUS, apexAltKm);

  return new THREE.QuadraticBezierCurve3(p1, p2, p3);
}

/**
 * Creates high-detail tactical dark earth texture with glowing coastlines, graticules & night lights
 */
export function generateTacticalEarthTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Deep Oceanic Abyss
  ctx.fillStyle = '#03080d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Graticule coordinate lines (Lat/Lng grid)
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += canvas.width / 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += canvas.height / 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Equator and Prime Meridian accent lines
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  // 3. Stylized Continents (High contrast dark landmasses)
  // We use equirectangular coordinates for major continents
  ctx.fillStyle = '#0b1924';
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
  ctx.lineWidth = 2;

  const toCanvas = (lat: number, lng: number): [number, number] => {
    const x = ((lng + 180) / 360) * canvas.width;
    const y = ((90 - lat) / 180) * canvas.height;
    return [x, y];
  };

  const drawContinent = (points: [number, number][]) => {
    if (points.length === 0) return;
    ctx.beginPath();
    const [startX, startY] = toCanvas(points[0][0], points[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < points.length; i++) {
      const [px, py] = toCanvas(points[i][0], points[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // North America
  drawContinent([
    [70, -160], [72, -130], [60, -90], [55, -60], [45, -55], [30, -80],
    [25, -80], [20, -90], [15, -95], [8, -80], [10, -75], [18, -105],
    [32, -118], [40, -125], [50, -128], [60, -140], [65, -168]
  ]);

  // South America
  drawContinent([
    [10, -75], [5, -50], [-5, -35], [-20, -40], [-35, -55], [-55, -68],
    [-52, -75], [-35, -72], [-20, -70], [-5, -80], [5, -78]
  ]);

  // Europe
  drawContinent([
    [70, 25], [60, 30], [55, 38], [45, 30], [40, 28], [36, -5],
    [44, -9], [48, -5], [55, 8], [60, 5], [70, 20]
  ]);

  // Africa
  drawContinent([
    [35, -5], [37, 10], [32, 32], [28, 34], [12, 51], [5, 48],
    [-10, 40], [-25, 32], [-35, 20], [-34, 18], [-20, 12], [5, 2],
    [15, -17], [28, -12], [35, -5]
  ]);

  // Asia / Eurasia
  drawContinent([
    [75, 40], [78, 105], [70, 170], [60, 165], [50, 140], [40, 130],
    [35, 120], [22, 115], [10, 105], [1, 104], [15, 95], [22, 88],
    [20, 70], [25, 60], [12, 45], [30, 35], [45, 35], [55, 60], [70, 40]
  ]);

  // India Peninsula
  drawContinent([
    [32, 75], [28, 88], [22, 88], [15, 80], [8, 77], [13, 74], [20, 70], [25, 68], [30, 70]
  ]);

  // Australia
  drawContinent([
    [-12, 130], [-12, 142], [-22, 150], [-35, 150], [-38, 140],
    [-35, 115], [-22, 114], [-15, 124]
  ]);

  // 4. Glowing City clusters / Strategic nodes
  ctx.fillStyle = '#6ee7b7';
  ctx.shadowColor = '#34d399';
  ctx.shadowBlur = 8;

  const cities: [number, number, number][] = [
    [28.6, 77.2, 4], [18.9, 72.8, 3], [38.9, -77.0, 4], [40.7, -74.0, 4],
    [55.7, 37.6, 4], [50.4, 30.5, 3], [35.7, 139.7, 4], [39.9, 116.4, 4],
    [31.2, 121.5, 3], [51.5, -0.1, 4], [48.8, 2.3, 3], [52.5, 13.4, 3],
    [35.6, 51.4, 3], [32.0, 34.8, 3], [-33.8, 151.2, 3], [-15.8, -47.9, 3]
  ];

  cities.forEach(([lat, lng, r]) => {
    const [cx, cy] = toCanvas(lat, lng);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates atmospheric glow mesh around the Earth
 */
export function createAtmosphereMesh(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 48, 48);
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
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
        gl_FragColor = vec4(0.05, 0.75, 0.55, 1.0) * intensity * 0.9;
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
  const starCount = 1800;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const radius = 600 + Math.random() * 800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const brightness = 0.4 + Math.random() * 0.6;
    colors[i * 3] = 0.5 * brightness;
    colors[i * 3 + 1] = 0.9 * brightness;
    colors[i * 3 + 2] = 0.8 * brightness;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  });

  return new THREE.Points(geometry, material);
}
