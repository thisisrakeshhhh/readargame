export interface RegionalFeature {
  name: string;
  dx: number; // km offset from center
  dy: number; // km offset from center (north is negative y in screen canvas, but positive in geography)
  type: 'capital' | 'city' | 'airbase' | 'naval_base' | 'outpost' | 'river' | 'border' | 'coastline';
  path?: [number, number][]; // array of [dx, dy] relative km points
}

export interface GeoLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  flag: string;
  lat: number;
  lng: number;
  description: string;
  features?: RegionalFeature[];
}

export type TargetCategory = 'BALLISTIC' | 'CRUISE' | 'UAV' | 'AIRCRAFT' | 'HYPERSONIC' | 'UNKNOWN';

export interface Target2D {
  id: string;
  callsign: string;
  category: TargetCategory;
  symbol: string;
  x: number; // Current position px relative to radar center
  y: number;
  vx: number; // Velocity px/sec
  vy: number;
  speedKmS: number;
  distanceKm: number;
  status: 'UNKNOWN' | 'SCANNING' | 'HOSTILE';
  aiState: 'OUTSIDE' | 'DETECTED' | 'TRACKING' | 'LOCKED' | 'INTERCEPTING' | 'DESTROYED';
  isIntercepting: boolean;
  scanPulse: number; // 0 to 1
  lastScannedAngle: number;
  trail: [number, number][];
}

export interface Interceptor2D {
  id: string;
  targetId: string;
  x: number;
  y: number;
  speedPxS: number;
}

export interface Explosion2D {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  progress: number;
  color: string;
}
