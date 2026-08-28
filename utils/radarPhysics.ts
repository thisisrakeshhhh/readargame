import { Threat, Interceptor, NavalUnit, AirUnit, GroundFacility, ExplosionEffect, Position, ThreatType } from '../types/game';

export const CANVAS_SIZE = 700;
export const RADAR_CENTER: Position = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
export const RADAR_RADIUS = 280; // pixels on canvas

export function getDistance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getAngle(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function isPointInRadar(pos: Position): boolean {
  return getDistance(pos, RADAR_CENTER) <= RADAR_RADIUS;
}

export function generateRandomPerimeterPosition(): Position {
  const angle = Math.random() * Math.PI * 2;
  const dist = RADAR_RADIUS + 30 + Math.random() * 40;
  return {
    x: RADAR_CENTER.x + Math.cos(angle) * dist,
    y: RADAR_CENTER.y + Math.sin(angle) * dist,
  };
}

export function createThreat(id: number, wave: number): Threat {
  const types: ThreatType[] = ['ballistic_missile', 'cruise_missile', 'enemy_jet', 'hypersonic', 'stealth_bomber'];
  const typeWeights = [0.4, 0.3, 0.15, 0.1, 0.05];
  
  // Pick type weighted
  let rand = Math.random();
  let selectedType: ThreatType = 'ballistic_missile';
  for (let i = 0; i < types.length; i++) {
    if (rand < typeWeights[i]) {
      selectedType = types[i];
      break;
    }
    rand -= typeWeights[i];
  }

  const origin = generateRandomPerimeterPosition();
  // Target is usually somewhere near center (city/facility/radar base)
  const targetOffsetAngle = Math.random() * Math.PI * 2;
  const targetOffsetDist = Math.random() * 80;
  const target: Position = {
    x: RADAR_CENTER.x + Math.cos(targetOffsetAngle) * targetOffsetDist,
    y: RADAR_CENTER.y + Math.sin(targetOffsetAngle) * targetOffsetDist,
  };

  let speed = 0.8 + Math.random() * 0.4;
  let health = 1;
  let scoreValue = 100;
  let name = `THREAT-${id}`;
  let altitude = 10000;

  if (selectedType === 'hypersonic') {
    speed = 2.2;
    scoreValue = 300;
    name = `HYPER-${id}`;
    altitude = 25000;
  } else if (selectedType === 'cruise_missile') {
    speed = 1.1;
    scoreValue = 150;
    name = `CRUISE-${id}`;
    altitude = 2000;
  } else if (selectedType === 'enemy_jet') {
    speed = 0.9;
    health = 2;
    scoreValue = 200;
    name = `FOX-${id}`;
    altitude = 8000;
  } else if (selectedType === 'stealth_bomber') {
    speed = 0.7;
    health = 3;
    scoreValue = 400;
    name = `GHOST-${id}`;
    altitude = 12000;
  }

  const heading = (getAngle(origin, target) * (180 / Math.PI) + 90 + 360) % 360;

  return {
    id: `threat-${id}-${Date.now()}`,
    type: selectedType,
    name,
    position: { ...origin },
    origin,
    target,
    speed,
    heading,
    altitude,
    health,
    maxHealth: health,
    detected: true,
    scoreValue,
  };
}

export function updateThreatPosition(threat: Threat): Threat {
  const angle = getAngle(threat.position, threat.target);
  const vx = Math.cos(angle) * threat.speed;
  const vy = Math.sin(angle) * threat.speed;

  return {
    ...threat,
    position: {
      x: threat.position.x + vx,
      y: threat.position.y + vy,
    },
    heading: (angle * (180 / Math.PI) + 90 + 360) % 360,
  };
}

export function updateInterceptorPosition(interceptor: Interceptor): Interceptor {
  if (interceptor.isManualControlled && interceptor.manualVelocity) {
    return {
      ...interceptor,
      position: {
        x: interceptor.position.x + interceptor.manualVelocity.vx,
        y: interceptor.position.y + interceptor.manualVelocity.vy,
      },
    };
  }

  const angle = getAngle(interceptor.position, interceptor.target);
  const vx = Math.cos(angle) * interceptor.speed;
  const vy = Math.sin(angle) * interceptor.speed;

  return {
    ...interceptor,
    position: {
      x: interceptor.position.x + vx,
      y: interceptor.position.y + vy,
    },
    heading: (angle * (180 / Math.PI) + 90 + 360) % 360,
  };
}

export function findAutoTarget(
  threats: Threat[],
  interceptors: Interceptor[],
  facilities: GroundFacility[],
  ships: NavalUnit[]
): { sourcePos: Position; targetPos: Position; sourceId: string } | null {
  // Find undetected threats moving into radar radius without an interceptor heading for them
  const targetedThreatIds = new Set(interceptors.map(i => i.id));

  // Find incoming threat closest to radar center
  let candidate: Threat | null = null;
  let minDistToCenter = Infinity;

  for (const threat of threats) {
    const distToCenter = getDistance(threat.position, RADAR_CENTER);
    if (distToCenter <= RADAR_RADIUS && distToCenter < minDistToCenter) {
      minDistToCenter = distToCenter;
      candidate = threat;
    }
  }

  if (!candidate) return null;

  // Find operational launch asset (facility or ship) with ammo closest to candidate
  let bestSourcePos: Position | null = null;
  let bestSourceId: string | null = null;
  let minSourceDist = Infinity;

  for (const fac of facilities) {
    if (fac.isOperational && fac.type === 'sam_silo' && (fac.ammo ?? 1) > 0) {
      const d = getDistance(fac.position, candidate.position);
      if (d < minSourceDist) {
        minSourceDist = d;
        bestSourcePos = fac.position;
        bestSourceId = fac.id;
      }
    }
  }

  for (const ship of ships) {
    if (ship.samAmmo > 0) {
      const d = getDistance(ship.position, candidate.position);
      if (d < minSourceDist) {
        minSourceDist = d;
        bestSourcePos = ship.position;
        bestSourceId = ship.id;
      }
    }
  }

  if (bestSourcePos && bestSourceId) {
    // Predict lead intercept position
    const leadTime = minSourceDist / 3.5;
    const angle = getAngle(candidate.position, candidate.target);
    const predictedX = candidate.position.x + Math.cos(angle) * candidate.speed * leadTime;
    const predictedY = candidate.position.y + Math.sin(angle) * candidate.speed * leadTime;

    return {
      sourcePos: bestSourcePos,
      targetPos: { x: predictedX, y: predictedY },
      sourceId: bestSourceId,
    };
  }

  return null;
}
