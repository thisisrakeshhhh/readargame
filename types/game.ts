export type DefenseMode = 'manual' | 'auto';
export type ScreenView = 'setup' | 'defense' | 'attack';
export type Difficulty = 'rookie' | 'veteran' | 'commander';

export interface Position {
  x: number;
  y: number;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
  lat: number;
  lng: number;
  radarRadius: number; // kilometers
  maxAmmo: number;
  interceptorSpeed: number; // relative speed multiplier
  description: string;
  startingSilos: number;
  startingShips: number;
  startingJets: number;
}

export type ThreatType = 'ballistic_missile' | 'cruise_missile' | 'hypersonic' | 'enemy_jet' | 'stealth_bomber';

export interface Threat {
  id: string;
  type: ThreatType;
  name: string;
  position: Position;
  origin: Position;
  target: Position;
  speed: number;
  heading: number; // in degrees
  altitude: number; // in meters
  health: number;
  maxHealth: number;
  detected: boolean;
  scoreValue: number;
}

export type InterceptorType = 'silo_abm' | 'ship_sam' | 'fighter_jet';

export interface Interceptor {
  id: string;
  type: InterceptorType;
  sourceId: string;
  position: Position;
  target: Position;
  speed: number;
  heading: number;
  isManualControlled: boolean;
  manualVelocity?: { vx: number; vy: number };
  explosionRadius: number;
  fuseDistance: number;
}

export type NavalType = 'carrier' | 'destroyer' | 'submarine';

export interface NavalUnit {
  id: string;
  type: NavalType;
  name: string;
  position: Position;
  destination: Position;
  speed: number;
  samAmmo: number;
  samMaxAmmo: number;
  samRange: number;
  health: number;
  maxHealth: number;
  status: 'patrol' | 'anchored' | 'engaging';
}

export type AirType = 'fighter' | 'bomber' | 'awacs';

export interface AirUnit {
  id: string;
  type: AirType;
  name: string;
  position: Position;
  destination: Position;
  speed: number;
  fuel: number;
  maxFuel: number;
  ammo: number;
  status: 'patrol' | 'scrambling' | 'intercepting' | 'rtb';
}

export type FacilityType = 'sam_silo' | 'airbase' | 'radar_tower' | 'city';

export interface GroundFacility {
  id: string;
  type: FacilityType;
  name: string;
  position: Position;
  health: number;
  maxHealth: number;
  isOperational: boolean;
  ammo?: number;
  maxAmmo?: number;
}

export interface ExplosionEffect {
  id: string;
  position: Position;
  currentRadius: number;
  maxRadius: number;
  duration: number;
  elapsed: number;
  color: string;
}

export interface GameStats {
  intercepted: number;
  impacts: number;
  shotsFired: number;
  manualShots: number;
  autoShots: number;
  score: number;
  integrity: number; // percentage 0-100
  ammo: number;
  maxAmmo: number;
  threatLevel: 'SAFE' | 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
  wave: number;
}

export interface PrivacyPreferences {
  cookieConsentGiven: boolean;
  analyticsEnabled: boolean;
  adsEnabled: boolean;
  locationAccessGranted: boolean;
  userCoords: { lat: number; lng: number } | null;
  locationName?: string;
}
