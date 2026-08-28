export type DefenseMode = 'MANUAL' | 'AUTO';
export type RadarRange = 50 | 100 | 250 | 500;
export type GameView = 'START' | 'TRANSITION' | 'THEATER';

export interface GeoLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  flag: string;
  lat: number;
  lng: number;
  theaterType: string;
  defenseGrade: 'ALPHA' | 'BRAVO' | 'DELTA' | 'OMEGA';
  description: string;
  silosCount: number;
  shipsCount: number;
  jetsCount: number;
}

export type ContactType =
  | 'HOSTILE_BALLISTIC'
  | 'HOSTILE_HYPERSONIC'
  | 'HOSTILE_CRUISE'
  | 'HOSTILE_AIRCRAFT'
  | 'HOSTILE_DRONE'
  | 'HOSTILE_NAVAL'
  | 'UNKNOWN'
  | 'FRIENDLY_FIGHTER'
  | 'FRIENDLY_SAM'
  | 'FRIENDLY_CARRIER'
  | 'FRIENDLY_RADAR'
  | 'CITY_BASE';

export type ContactStatus = 'UNKNOWN' | 'CLASSIFYING' | 'HOSTILE' | 'FRIENDLY' | 'INTERCEPTED' | 'IMPACTED';
export type ThreatLevel = 'SAFE' | 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';

export interface TacticalContact {
  id: string;
  callsign: string;
  type: ContactType;
  status: ContactStatus;
  lat: number;
  lng: number;
  altKm: number;
  originLat: number;
  originLng: number;
  targetLat: number;
  targetLng: number;
  velocityKmS: number;
  headingDeg: number;
  threatLevel: ThreatLevel;
  etaSeconds: number;
  classificationProgress: number; // 0 to 100
  scoreValue: number;
  trajectoryPoints: [number, number, number][]; // [lat, lng, altKm]
}

export interface WeaponSystem {
  id: string;
  name: string;
  type: 'ABM' | 'SAM' | 'AAM' | 'AEGIS';
  rangeKm: number;
  speedMach: number;
  ammo: number;
  maxAmmo: number;
  successProbability: number;
  description: string;
}

export interface TacticalMissile {
  id: string;
  weaponId: string;
  sourceName: string;
  sourceLat: number;
  sourceLng: number;
  currentLat: number;
  currentLng: number;
  currentAltKm: number;
  targetContactId?: string;
  targetLat: number;
  targetLng: number;
  speedMach: number;
  isManualGuidance: boolean;
  manualHeadingOffset: number;
  fuelPercent: number;
  flightProgress: number; // 0 to 1
  trajectory: [number, number, number][];
}

export interface Explosion3D {
  id: string;
  lat: number;
  lng: number;
  altKm: number;
  radiusKm: number;
  maxRadiusKm: number;
  durationSec: number;
  elapsedSec: number;
  color: string;
}

export interface TacticalMission {
  id: string;
  code: string;
  title: string;
  type: 'AIR_DEFENSE' | 'INTERCEPT_CONTACT' | 'INVESTIGATE_ANOMALY' | 'STRATEGIC_DEFENSE';
  objective: string;
  secondaryObjective: string;
  targetContactId?: string;
  threatCallsign?: string;
  eta?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  rewardScore: number;
  progressPercent: number;
}

export interface IntelLog {
  id: string;
  timestamp: string;
  category: 'DETECTION' | 'CLASSIFICATION' | 'WARNING' | 'LOCK' | 'LAUNCH' | 'INTERCEPT' | 'IMPACT' | 'MISSION' | 'AI_DEFENSE';
  message: string;
  threatLevel?: ThreatLevel;
}

export interface TacticalStats {
  intercepted: number;
  impacts: number;
  shotsFired: number;
  manualShots: number;
  autoShots: number;
  score: number;
  integrity: number; // 0-100%
  threatLevel: ThreatLevel;
  wave: number;
}
