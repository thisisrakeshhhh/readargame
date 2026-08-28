export interface RegionMapData {
  id: string;
  name: string;
  paths: string[];
}

export const WORLD_COASTLINES: Record<string, string[]> = {
  // Europe & Mediterranean (matching screenshot geography)
  europe: [
    // Main continent outline snippet (polygons scaled to -1 to 1 normalize range)
    "M -0.4,-0.6 L -0.2,-0.7 L 0.1,-0.6 L 0.3,-0.4 L 0.4,-0.2 L 0.2,0.1 L 0.0,0.3 L -0.3,0.4 L -0.6,0.2 L -0.5,-0.2 Z",
    // Scandinavia / Baltic Sea
    "M -0.1,-0.8 L 0.1,-0.9 L 0.2,-0.7 L 0.0,-0.6 Z",
    // Mediterranean sea outline
    "M -0.5,0.3 L -0.1,0.2 L 0.3,0.3 L 0.5,0.5 L 0.1,0.6 L -0.3,0.5 Z",
    // Black sea
    "M 0.2,0.1 L 0.4,0.1 L 0.45,0.25 L 0.25,0.2 Z",
  ],
  // North America
  usa: [
    "M -0.7,-0.4 L 0.5,-0.4 L 0.7,-0.1 L 0.6,0.4 L 0.1,0.5 L -0.5,0.4 L -0.8,0.0 Z",
    "M 0.5,0.4 L 0.6,0.6 L 0.5,0.7 Z", // Florida
    "M -0.7,0.0 L -0.6,0.2 L -0.8,0.3 Z", // Baja
  ],
  // India & South Asia
  india: [
    "M -0.5,-0.6 L 0.5,-0.6 L 0.4,-0.1 L 0.0,0.7 L -0.4,-0.1 Z", // Peninsula triangular shield
    "M 0.1,0.7 L 0.2,0.8 L 0.1,0.85 Z", // Sri Lanka
  ],
  // East Asia / Japan
  japan: [
    "M -0.6,-0.4 L -0.2,-0.5 L 0.4,-0.2 L 0.6,0.2 L 0.2,0.5 L -0.4,0.3 Z",
    "M 0.2,-0.6 L 0.4,-0.4 L 0.5,-0.1 L 0.3,0.3 Z", // Island arc
  ],
  // Middle East
  middle_east: [
    "M -0.5,-0.5 L 0.3,-0.5 L 0.6,-0.1 L 0.4,0.5 L -0.1,0.6 L -0.4,0.1 Z",
    "M 0.0,0.1 L 0.2,0.3 L 0.1,0.4 Z", // Arabian gulf
  ],
  // Global / Generic
  global: [
    "M -0.6,-0.5 L -0.3,-0.7 L 0.2,-0.6 L 0.6,-0.3 L 0.5,0.2 L 0.1,0.6 L -0.4,0.5 L -0.7,0.1 Z",
    "M -0.2,-0.2 L 0.2,-0.2 L 0.3,0.1 L -0.1,0.2 Z",
  ]
};

export const COUNTRIES_DATA = [
  {
    id: "usa",
    name: "United States",
    code: "US",
    flag: "🇺🇸",
    lat: 38.8951,
    lng: -77.0364,
    radarRadius: 250,
    maxAmmo: 40,
    interceptorSpeed: 1.2,
    description: "Advanced NORAD defense network with high-speed PAC-3 MSE interceptors and naval Aegis fleets.",
    startingSilos: 4,
    startingShips: 3,
    startingJets: 4,
  },
  {
    id: "ukraine",
    name: "Ukraine / Eastern Europe",
    code: "UA",
    flag: "🇺🇦",
    lat: 50.4501,
    lng: 30.5234,
    radarRadius: 220,
    maxAmmo: 30,
    interceptorSpeed: 1.1,
    description: "Layered IRIS-T, NASAMS and Patriot anti-ballistic shield over central radar grid.",
    startingSilos: 3,
    startingShips: 1,
    startingJets: 3,
  },
  {
    id: "india",
    name: "India",
    code: "IN",
    flag: "🇮🇳",
    lat: 28.6139,
    lng: 77.209,
    radarRadius: 240,
    maxAmmo: 35,
    interceptorSpeed: 1.15,
    description: "S-400 Triumf & Akash Prime SAM networks guarding peninsula sea routes and northern airspace.",
    startingSilos: 4,
    startingShips: 2,
    startingJets: 4,
  },
  {
    id: "japan",
    name: "Japan",
    code: "JP",
    flag: "🇯🇵",
    lat: 35.6762,
    lng: 139.6503,
    radarRadius: 230,
    maxAmmo: 32,
    interceptorSpeed: 1.25,
    description: "Maritime Aegis destroyers combined with JSDF PAC-3 batteries guarding island coastal sectors.",
    startingSilos: 3,
    startingShips: 4,
    startingJets: 3,
  },
  {
    id: "germany",
    name: "Germany / EU Central",
    code: "DE",
    flag: "🇩🇪",
    lat: 52.52,
    lng: 13.405,
    radarRadius: 210,
    maxAmmo: 28,
    interceptorSpeed: 1.05,
    description: "European Skyshield Alliance featuring rapid-response SAM batteries and Baltic naval patrols.",
    startingSilos: 3,
    startingShips: 2,
    startingJets: 3,
  },
  {
    id: "uk",
    name: "United Kingdom",
    code: "GB",
    flag: "🇬🇧",
    lat: 51.5074,
    lng: -0.1278,
    radarRadius: 220,
    maxAmmo: 30,
    interceptorSpeed: 1.1,
    description: "Royal Navy Type 45 Destroyers with Sea Viper missiles and RAF Typhoon scramble squadrons.",
    startingSilos: 3,
    startingShips: 3,
    startingJets: 3,
  },
  {
    id: "brazil",
    name: "Brazil / S. America",
    code: "BR",
    flag: "🇧🇷",
    lat: -15.7975,
    lng: -47.8919,
    radarRadius: 200,
    maxAmmo: 25,
    interceptorSpeed: 1.0,
    description: "Atlantic coast naval patrol Task Force backed by long-range radar tracking towers.",
    startingSilos: 2,
    startingShips: 2,
    startingJets: 2,
  },
  {
    id: "australia",
    name: "Australia",
    code: "AU",
    flag: "🇦🇺",
    lat: -35.2809,
    lng: 149.13,
    radarRadius: 260,
    maxAmmo: 30,
    interceptorSpeed: 1.1,
    description: "JORN Over-The-Horizon long range radar network with Hobart-class guided missile destroyers.",
    startingSilos: 3,
    startingShips: 3,
    startingJets: 3,
  }
];
