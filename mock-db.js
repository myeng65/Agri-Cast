/**
 * mock-db.js — AgriCast Static Data
 * Crop database, field records, and weather forecasts.
 */
/* ── Crop Database ─────────────────────────────────────────── */
const CROP_DB = [
  {
    id: 'wheat', name: 'Wheat', emoji: '🌾', type: 'Grain',
    phMin: 6.0, phMax: 7.0,
    nMin: 40,  nMax: 70,  pMin: 30, pMax: 50, kMin: 50,  kMax: 80,
    moistureMin: 30, moistureMax: 55, tempMin: 10, tempMax: 24, growDays: 120,
    desc: 'High-yield cereal grain. Best sown in cool, dry conditions with loam soil.'
  },
  {
    id: 'corn', name: 'Maize (Corn)', emoji: '🌽', type: 'Grain',
    phMin: 5.8, phMax: 7.0,
    nMin: 80,  nMax: 120, pMin: 40, pMax: 70, kMin: 80,  kMax: 120,
    moistureMin: 45, moistureMax: 70, tempMin: 16, tempMax: 32, growDays: 100,
    desc: 'Warm-season staple crop. Requires high nitrogen and consistent moisture.'
  },
  {
    id: 'soybean', name: 'Soybeans', emoji: '🫘', type: 'Legume',
    phMin: 6.0, phMax: 6.8,
    nMin: 20,  nMax: 40,  pMin: 30, pMax: 60, kMin: 60,  kMax: 90,
    moistureMin: 40, moistureMax: 65, tempMin: 15, tempMax: 27, growDays: 110,
    desc: 'Nitrogen-fixing legume. Ideal as a rotation crop to improve soil fertility.'
  },
  {
    id: 'potato', name: 'Potato', emoji: '🥔', type: 'Tuber',
    phMin: 5.0, phMax: 6.0,
    nMin: 60,  nMax: 90,  pMin: 50, pMax: 80, kMin: 90,  kMax: 140,
    moistureMin: 50, moistureMax: 70, tempMin: 7,  tempMax: 21, growDays: 90,
    desc: 'High-yield tuber crop. Prefers slightly acidic soil with high potassium.'
  },
  {
    id: 'tomato', name: 'Tomato', emoji: '🍅', type: 'Vegetable',
    phMin: 6.0, phMax: 6.8,
    nMin: 70,  nMax: 100, pMin: 50, pMax: 80, kMin: 80,  kMax: 130,
    moistureMin: 55, moistureMax: 75, tempMin: 18, tempMax: 29, growDays: 75,
    desc: 'Warm-season vegetable. Requires consistent irrigation and staking support.'
  },
  {
    id: 'rice', name: 'Rice', emoji: '🌾', type: 'Grain',
    phMin: 5.5, phMax: 6.5,
    nMin: 60,  nMax: 100, pMin: 30, pMax: 50, kMin: 40,  kMax: 70,
    moistureMin: 75, moistureMax: 95, tempMin: 20, tempMax: 35, growDays: 130,
    desc: 'Flooded paddy crop. Requires very high moisture and warm temperatures.'
  },
  {
    id: 'strawberry', name: 'Strawberry', emoji: '🍓', type: 'Fruit',
    phMin: 5.5, phMax: 6.5,
    nMin: 40,  nMax: 60,  pMin: 40, pMax: 60, kMin: 60,  kMax: 90,
    moistureMin: 50, moistureMax: 70, tempMin: 13, tempMax: 25, growDays: 60,
    desc: 'Delicate fruit requiring slightly acidic, well-drained soil and mild temperatures.'
  }
];
/* ── Field Records ─────────────────────────────────────────── */
const FIELD_DB = [
  {
    id: 'east-acre',
    name: 'East Acre',
    crop: 'Wheat',
    area: '3.2 ha',
    moisture: 45,
    temp: 21,
    ph: 6.5,
    n: 75, p: 48, k: 95,
    status: 'ok',
    lastSync: '2 min ago'
  },
  {
    id: 'west-ridge',
    name: 'West Ridge',
    crop: 'Maize (Corn)',
    area: '5.1 ha',
    moisture: 62,
    temp: 24,
    ph: 6.2,
    n: 95, p: 55, k: 100,
    status: 'ok',
    lastSync: '4 min ago'
  },
  {
    id: 'north-paddock',
    name: 'North Paddock',
    crop: 'Soybeans',
    area: '2.8 ha',
    moisture: 18,
    temp: 26,
    ph: 6.4,
    n: 30, p: 40, k: 72,
    status: 'alert',
    alertMsg: 'CRITICAL: Moisture 18% — Irrigate Immediately!',
    lastSync: '1 min ago'
  },
  {
    id: 'south-valley',
    name: 'South Valley',
    crop: 'Potato',
    area: '4.0 ha',
    moisture: 58,
    temp: 19,
    ph: 5.5,
    n: 72, p: 63, k: 115,
    status: 'warn',
    alertMsg: 'Moisture slightly elevated — monitor drainage.',
    lastSync: '3 min ago'
  }
];
/* ── 5-Day Weather Forecast ────────────────────────────────── */
const WEATHER_FORECAST = [
  {
    day: 'Mon', date: 'Jul 14',
    icon: '☀️', condition: 'Sunny',
    tempMin: 18, tempMax: 28, windSpeed: 10,
    humidity: 55, rainChance: 5
  },
  {
    day: 'Tue', date: 'Jul 15',
    icon: '⛅', condition: 'Cloudy',
    tempMin: 16, tempMax: 24, windSpeed: 14,
    humidity: 65, rainChance: 20
  },
  {
    day: 'Wed', date: 'Jul 16',
    icon: '🌧️', condition: 'Light Rain',
    tempMin: 14, tempMax: 20, windSpeed: 18,
    humidity: 80, rainChance: 70
  },
  {
    day: 'Thu', date: 'Jul 17',
    icon: '⛈️', condition: 'Thunderstorm',
    tempMin: 12, tempMax: 18, windSpeed: 32,
    humidity: 90, rainChance: 95
  },
  {
    day: 'Fri', date: 'Jul 18',
    icon: '🌤️', condition: 'Partly Cloudy',
    tempMin: 17, tempMax: 26, windSpeed: 11,
    humidity: 60, rainChance: 15
  }
];
