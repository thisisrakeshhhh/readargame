import { GeoLocation } from '../types/tactical';

export const WORLD_LOCATIONS: GeoLocation[] = [
  // --- INDIA & SOUTH ASIA ---
  {
    id: 'india-delhi',
    name: 'New Delhi',
    region: 'Delhi NCR',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    lat: 28.6139,
    lng: 77.209,
    description: 'National Capital Region air defense grid protecting Delhi, Gurgaon, Noida, and surrounding strategic sectors.',
    features: [
      { name: 'DELHI CENTER', dx: 0, dy: 0, type: 'capital' },
      { name: 'GURGAON', dx: -28, dy: 24, type: 'city' },
      { name: 'NOIDA', dx: 22, dy: 14, type: 'city' },
      { name: 'FARIDABAD', dx: 12, dy: 35, type: 'city' },
      { name: 'GHAZIABAD', dx: 25, dy: -18, type: 'city' },
      { name: 'MEERUT', dx: 65, dy: -55, type: 'city' },
      { name: 'ROHTAK', dx: -68, dy: -12, type: 'city' },
      { name: 'SONIPAT', dx: -15, dy: -42, type: 'city' },
      { name: 'PANIPAT', dx: -18, dy: -85, type: 'city' },
      { name: 'HINDON AIRBASE', dx: 20, dy: -12, type: 'airbase' },
      { name: 'PALAM AFS', dx: -14, dy: 8, type: 'airbase' },
      {
        name: 'YAMUNA RIVER',
        dx: 0,
        dy: 0,
        type: 'river',
        path: [[-18, -100], [-12, -60], [-5, -20], [8, 10], [15, 45], [35, 90]],
      },
      {
        name: 'NCR PERIMETER',
        dx: 0,
        dy: 0,
        type: 'border',
        path: [[-85, -60], [40, -90], [90, -40], [80, 60], [-10, 90], [-80, 50], [-85, -60]],
      },
    ],
  },
  {
    id: 'india-chandigarh',
    name: 'Chandigarh',
    region: 'Punjab / Haryana Sector',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    lat: 30.7333,
    lng: 76.7794,
    description: 'Western Air Command northern defense corridor protecting Chandigarh, Mohali, Panchkula, and Ambala.',
    features: [
      { name: 'CHANDIGARH HQ', dx: 0, dy: 0, type: 'capital' },
      { name: 'MOHALI', dx: -10, dy: 8, type: 'city' },
      { name: 'PANCHKULA', dx: 12, dy: -4, type: 'city' },
      { name: 'AMBALA AFS', dx: 8, dy: 45, type: 'airbase' },
      { name: 'PATIALA', dx: -55, dy: 40, type: 'city' },
      { name: 'LUDHIANA', dx: -95, dy: -12, type: 'city' },
      { name: 'PINJORE', dx: 18, dy: -16, type: 'city' },
      { name: 'SHIVALIK RIDGE', dx: 25, dy: -35, type: 'border', path: [[-40, -50], [0, -35], [45, -20], [80, -5]] },
      { name: 'GHAGGAR RIVER', dx: 0, dy: 0, type: 'river', path: [[25, -20], [10, 10], [-25, 45], [-60, 80]] },
    ],
  },
  {
    id: 'india-mumbai',
    name: 'Mumbai',
    region: 'Western Naval Command',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    lat: 18.922,
    lng: 72.8347,
    description: 'Western Naval Command maritime defense zone covering Mumbai, Navi Mumbai, Thane, and the Arabian Sea.',
    features: [
      { name: 'MUMBAI BASE', dx: 0, dy: 0, type: 'capital' },
      { name: 'NAVI MUMBAI', dx: 22, dy: -8, type: 'city' },
      { name: 'THANE', dx: 12, dy: -28, type: 'city' },
      { name: 'KALYAN', dx: 35, dy: -32, type: 'city' },
      { name: 'PUNE', dx: 95, dy: 85, type: 'city' },
      { name: 'TROMBAY NAVAL', dx: 14, dy: -5, type: 'naval_base' },
      {
        name: 'ARABIAN SEA COAST',
        dx: 0,
        dy: 0,
        type: 'coastline',
        path: [[-10, -90], [-8, -40], [-4, 0], [5, 30], [2, 80], [10, 120]],
      },
    ],
  },
  {
    id: 'ukraine-kyiv',
    name: 'Kyiv',
    region: 'Kyiv Oblast',
    country: 'Ukraine',
    countryCode: 'UA',
    flag: '🇺🇦',
    lat: 50.4501,
    lng: 30.5234,
    description: 'Central air defense shield protecting the capital city of Kyiv, Hostomel, and the Dnipro river valley.',
    features: [
      { name: 'KYIV CENTER', dx: 0, dy: 0, type: 'capital' },
      { name: 'BORYSPIL', dx: 32, dy: 10, type: 'city' },
      { name: 'BROVARY', dx: 20, dy: -14, type: 'city' },
      { name: 'BUCHA', dx: -26, dy: -12, type: 'city' },
      { name: 'IRPIN', dx: -22, dy: -6, type: 'city' },
      { name: 'VASYLKIV AFS', dx: -18, dy: 35, type: 'airbase' },
      { name: 'CHERNIHIV', dx: 45, dy: -95, type: 'city' },
      {
        name: 'DNIPRO RIVER',
        dx: 0,
        dy: 0,
        type: 'river',
        path: [[15, -110], [5, -50], [0, 0], [20, 55], [35, 110]],
      },
    ],
  },
  {
    id: 'russia-moscow',
    name: 'Moscow',
    region: 'Moscow Oblast',
    country: 'Russia',
    countryCode: 'RU',
    flag: '🇷🇺',
    lat: 55.7558,
    lng: 37.6173,
    description: 'A-135 Strategic Ballistic Missile Defense ring around Moscow and adjacent military sectors.',
    features: [
      { name: 'KREMLIN HQ', dx: 0, dy: 0, type: 'capital' },
      { name: 'KHIMKI', dx: -18, dy: -22, type: 'city' },
      { name: 'PODOLSK', dx: -5, dy: 38, type: 'city' },
      { name: 'BALASHIKHA', dx: 24, dy: -4, type: 'city' },
      { name: 'ODINTSOVO', dx: -25, dy: 8, type: 'city' },
      { name: 'ZHUKOVSKY AIRBASE', dx: 38, dy: 24, type: 'airbase' },
      { name: 'KUBINKA AFS', dx: -60, dy: 15, type: 'airbase' },
      {
        name: 'MOSKVA RIVER',
        dx: 0,
        dy: 0,
        type: 'river',
        path: [[-50, -15], [-20, 5], [0, 0], [30, 20], [60, 45]],
      },
    ],
  },
  {
    id: 'iran-tehran',
    name: 'Tehran',
    region: 'Tehran Province',
    country: 'Iran',
    countryCode: 'IR',
    flag: '🇮🇷',
    lat: 35.6892,
    lng: 51.389,
    description: 'Bavar-373 & Khordad-15 SAM batteries guarding Tehran and the southern Alborz mountain approaches.',
    features: [
      { name: 'TEHRAN HQ', dx: 0, dy: 0, type: 'capital' },
      { name: 'KARAJ', dx: -42, dy: -6, type: 'city' },
      { name: 'REY', dx: 5, dy: 16, type: 'city' },
      { name: 'VARAMIN', dx: 35, dy: 42, type: 'city' },
      { name: 'MEHRABAD AFS', dx: -10, dy: 2, type: 'airbase' },
      {
        name: 'ALBORZ MOUNTAINS',
        dx: 0,
        dy: 0,
        type: 'border',
        path: [[-80, -35], [-30, -30], [20, -35], [70, -45], [110, -60]],
      },
    ],
  },
  {
    id: 'usa-washington',
    name: 'Washington D.C.',
    region: 'National Capital Region',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    lat: 38.8951,
    lng: -77.0364,
    description: 'National Capital Region Integrated Air Defense System (NCR-IADS) with NASAMS and Avenger batteries.',
    features: [
      { name: 'PENTAGON / DC', dx: 0, dy: 0, type: 'capital' },
      { name: 'ARLINGTON', dx: -8, dy: 4, type: 'city' },
      { name: 'ALEXANDRIA', dx: -5, dy: 14, type: 'city' },
      { name: 'BETHESDA', dx: -12, dy: -15, type: 'city' },
      { name: 'SILVER SPRING', dx: 2, dy: -18, type: 'city' },
      { name: 'ANDREWS AFB', dx: 18, dy: 12, type: 'airbase' },
      { name: 'BALTIMORE', dx: 55, dy: -60, type: 'city' },
      {
        name: 'POTOMAC RIVER',
        dx: 0,
        dy: 0,
        type: 'river',
        path: [[-45, -50], [-20, -20], [0, 0], [10, 30], [25, 75]],
      },
    ],
  },
  {
    id: 'japan-tokyo',
    name: 'Tokyo',
    region: 'Kanto Region',
    country: 'Japan',
    countryCode: 'JP',
    flag: '🇯🇵',
    lat: 35.6762,
    lng: 139.6503,
    description: 'PAC-3 Patriot batteries and JSDF maritime Aegis destroyers protecting Tokyo Bay and metropolitan airspace.',
    features: [
      { name: 'TOKYO HQ', dx: 0, dy: 0, type: 'capital' },
      { name: 'YOKOHAMA', dx: -5, dy: 28, type: 'city' },
      { name: 'CHIBA', dx: 38, dy: 8, type: 'city' },
      { name: 'SAITAMA', dx: -2, dy: -26, type: 'city' },
      { name: 'KAWASAKI', dx: 0, dy: 16, type: 'city' },
      { name: 'YOKOSUKA NAVAL', dx: -2, dy: 45, type: 'naval_base' },
      { name: 'YOKOTA AIRBASE', dx: -35, dy: -10, type: 'airbase' },
      {
        name: 'TOKYO BAY COASTLINE',
        dx: 0,
        dy: 0,
        type: 'coastline',
        path: [[12, 10], [15, 30], [30, 45], [45, 25], [40, 5], [25, -5]],
      },
    ],
  },
  {
    id: 'uk-london',
    name: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    countryCode: 'GB',
    flag: '🇬🇧',
    lat: 51.5074,
    lng: -0.1278,
    description: 'Sky Sabre air defense network and RAF Coningsby QRA Typhoon interceptor squadrons.',
    features: [
      { name: 'LONDON HQ', dx: 0, dy: 0, type: 'capital' },
      { name: 'WESTMINSTER', dx: -3, dy: 2, type: 'city' },
      { name: 'GREENWICH', dx: 10, dy: 4, type: 'city' },
      { name: 'CROYDON', dx: 0, dy: 16, type: 'city' },
      { name: 'WATFORD', dx: -22, dy: -24, type: 'city' },
      { name: 'RAF NORTHOLT', dx: -20, dy: -5, type: 'airbase' },
      {
        name: 'THAMES RIVER',
        dx: 0,
        dy: 0,
        type: 'river',
        path: [[-45, 10], [-20, 5], [0, 0], [25, -2], [55, 12], [90, 8]],
      },
    ],
  },
  {
    id: 'china-beijing',
    name: 'Beijing',
    region: 'Jing-Jin-Ji Region',
    country: 'China',
    countryCode: 'CN',
    flag: '🇨🇳',
    lat: 39.9042,
    lng: 116.4074,
    description: 'HQ-9B long-range SAM battalions and automated interceptor radars defending the capital perimeter.',
    features: [
      { name: 'BEIJING HQ', dx: 0, dy: 0, type: 'capital' },
      { name: 'CHAOYANG', dx: 12, dy: -2, type: 'city' },
      { name: 'HAIDIAN', dx: -14, dy: -8, type: 'city' },
      { name: 'TONGZHOU', dx: 24, dy: 8, type: 'city' },
      { name: 'DAXING', dx: 2, dy: 35, type: 'city' },
      { name: 'NANYUAN AIRBASE', dx: 0, dy: 15, type: 'airbase' },
      { name: 'TIANJIN', dx: 95, dy: 80, type: 'city' },
    ],
  },
];

export function searchLocations(query: string): GeoLocation[] {
  const q = query.toLowerCase().trim();
  if (!q) return WORLD_LOCATIONS;

  return WORLD_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      loc.country.toLowerCase().includes(q) ||
      loc.region.toLowerCase().includes(q) ||
      loc.countryCode.toLowerCase().includes(q) ||
      loc.features?.some((f) => f.name.toLowerCase().includes(q))
  );
}

export function findNearestLocation(lat: number, lng: number): GeoLocation {
  let closest = WORLD_LOCATIONS[0];
  let minDistance = Infinity;

  WORLD_LOCATIONS.forEach((loc) => {
    const dist = Math.hypot(loc.lat - lat, loc.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  });

  return closest;
}
