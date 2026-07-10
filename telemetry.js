/**
 * telemetry.js — AgriCast Live IoT Simulation
 * Simulates real-time sensor drift so dashboard values feel alive.
 */
/* Current telemetry state — shared with app.js */
const telemetry = {
  moisture: 55,
  temperature: 22,
  windSpeed: 14,
  rainfall: 2.3,
  solar: 820,
  humidity: 68
};
/* Soil NPK / pH state */
const soilState = {
  ph: 6.5,
  n: 80,
  p: 50,
  k: 100
};
/**
 * Slightly drift a numeric value within [min, max], by ±delta.
 */
function drift(val, delta, min, max) {
  const change = (Math.random() - 0.5) * 2 * delta;
  return Math.min(max, Math.max(min, +(val + change).toFixed(1)));
}
/**
 * Update all telemetry readings with realistic micro-fluctuations.
 */
function updateTelemetry() {
  telemetry.moisture    = drift(telemetry.moisture,    1.5, 10,  95);
  telemetry.temperature = drift(telemetry.temperature, 0.5, 0,   50);
  telemetry.windSpeed   = drift(telemetry.windSpeed,   2.0, 0,   80);
  telemetry.rainfall    = drift(telemetry.rainfall,    0.3, 0,   20);
  telemetry.solar       = drift(telemetry.solar,       30,  0, 1200);
  telemetry.humidity    = drift(telemetry.humidity,    1.5, 20, 100);
  soilState.ph = drift(soilState.ph, 0.05, 3, 10);
  soilState.n  = drift(soilState.n,  1.5, 0, 200);
  soilState.p  = drift(soilState.p,  1.0, 0, 150);
  soilState.k  = drift(soilState.k,  1.5, 0, 200);
}
/**
 * Determine a status string for a given moisture level.
 */
function moistureStatus(pct) {
  if (pct < 30) return 'CRITICAL';
  if (pct < 40) return 'LOW';
  if (pct > 80) return 'HIGH';
  return 'OK';
}
/**
 * Return a human-readable time string "X min ago".
 */
function syncAgo(minutes) {
  if (minutes === 0) return 'just now';
  return `${minutes} min ago`;
}
/* Start the telemetry update loop (every 4 seconds) */
setInterval(updateTelemetry, 4000);
