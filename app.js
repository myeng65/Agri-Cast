/**
 * app.js — AgriCast Main Application Logic
 *
 * Responsibilities:
 *  1. Navigation routing (6 views)
 *  2. Dashboard live updates (soil metrics, telemetry, weather)
 *  3. Soil Analyzer (slider → score → insights)
 *  4. Weather Planner (forecast day selection → risk assessment)
 *  5. Crop Library (compatibility scoring)
 *  6. IoT Field Monitor (table with alerts)
 *  7. AI Advisor (simulated ReAct reasoning + optional live Gemini API)
 */
'use strict';
/* ── State ─────────────────────────────────────────────────── */
let geminiApiKey = '';
let useGeminiApi = false;
let selectedForecastDay = null;
/* View title mapping */
const VIEW_TITLES = {
  dashboardView:  'Precision Dashboard',
  soilView:       'Soil Health Analyzer',
  plannerView:    'Weather & Planting Planner',
  cropsView:      'Crop Compatibility Library',
  iotView:        'Live Field Telemetry Monitor',
  aiAdvisorView:  'AI Agronomist Advisor'
};
/* ── Utility ────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const round1 = (n) => Math.round(n * 10) / 10;
function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }
/**
 * Compute a soil health score (0-100) and list of insight strings
 * given the 7 soil parameters.
 */
function computeSoilScore({ ph, n, p, k, moisture, temp, soilType = 'loam' }) {
  let score = 100;
  const insights = [];
  // pH
  if (ph < 5.5) {
    score -= 25;
    insights.push({ type: 'danger', text: `⛔ pH ${ph} is severely acidic. Apply agricultural lime immediately.` });
  } else if (ph < 6.0) {
    score -= 12;
    insights.push({ type: 'warn', text: `⚠️ pH ${ph} is mildly acidic. Consider liming to raise towards 6.5.` });
  } else if (ph > 8.5) {
    score -= 35;
    insights.push({ type: 'danger', text: `⛔ pH ${ph} is severely alkaline — iron/manganese lockout risk. Apply elemental sulphur urgently.` });
  } else if (ph > 7.5) {
    score -= 12;
    insights.push({ type: 'warn', text: `⚠️ pH ${ph} is alkaline. Apply elemental sulphur or compost.` });
  }
  // N
  if (n < 40) {
    score -= 15;
    insights.push({ type: 'warn', text: `⚠️ Nitrogen (${n} mg/kg) is LOW. Apply ammonium nitrate or blood meal.` });
  } else if (n > 140) {
    score -= 8;
    insights.push({ type: 'warn', text: `⚠️ Nitrogen (${n} mg/kg) is EXCESS. Reduce applications — leaching risk.` });
  }
  // P
  if (p < 30) {
    score -= 15;
    insights.push({ type: 'warn', text: `⚠️ Phosphorus (${p} mg/kg) is LOW. Apply bone meal or triple superphosphate.` });
  } else if (p > 90) {
    score -= 8;
    insights.push({ type: 'warn', text: `⚠️ Phosphorus (${p} mg/kg) is EXCESS. Suspend phosphorus fertilisation.` });
  }
  // K
  if (k < 60) {
    score -= 15;
    insights.push({ type: 'warn', text: `⚠️ Potassium (${k} mg/kg) is LOW. Top-dress with potash or greensand.` });
  } else if (k > 160) {
    score -= 8;
    insights.push({ type: 'warn', text: `⚠️ Potassium (${k} mg/kg) is EXCESS. Reduce potassium input — salt stress risk.` });
  }
  // Moisture
  if (moisture < 35) {
    score -= 15;
    insights.push({ type: 'danger', text: `💧 Moisture (${moisture}%) CRITICALLY DRY. Initiate deep irrigation immediately.` });
  } else if (moisture < 40) {
    score -= 8;
    insights.push({ type: 'warn', text: `⚠️ Moisture (${moisture}%) is below optimal. Schedule irrigation within 12 hours.` });
  } else if (moisture > 80) {
    score -= 12;
    insights.push({ type: 'warn', text: `🌊 Moisture (${moisture}%) is WATERLOGGED. Suspend irrigation, check drainage.` });
  }
  // Soil type note
  const typeNotes = {
    clay:  { type: 'info', text: '🪨 Clay texture: heavy compaction risk above 60% moisture. Avoid heavy machinery.' },
    sand:  { type: 'info', text: '🏜️ Sandy texture: apply split-dose fertilisers to reduce nutrient leaching.' },
    peat:  { type: 'info', text: '🌿 Peaty soil: naturally acidic and high in organic carbon — monitor pH closely.' },
    silt:  { type: 'info', text: '🌊 Silt texture: highly fertile but prone to surface crust and erosion.' },
    loam:  { type: 'ok',   text: '✅ Loam texture: excellent balanced structure for most crops.' }
  };
  if (typeNotes[soilType]) insights.push(typeNotes[soilType]);
  score = clamp(score, 0, 100);
  const grade = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';
  if (insights.length === 0) {
    insights.push({ type: 'ok', text: '✅ All soil parameters are within optimal ranges. No action required.' });
  }
  return { score, grade, insights };
}
/**
 * Rank all crops by compatibility with current soil conditions.
 */
function rankCrops({ ph, n, p, k, moisture, temp }) {
  return CROP_DB.map(crop => {
    let match = 0;
    if (ph >= crop.phMin && ph <= crop.phMax) match++;
    if (n  >= crop.nMin  && n  <= crop.nMax)  match++;
    if (p  >= crop.pMin  && p  <= crop.pMax)  match++;
    if (k  >= crop.kMin  && k  <= crop.kMax)  match++;
    if (moisture >= crop.moistureMin && moisture <= crop.moistureMax) match++;
    if (temp     >= crop.tempMin     && temp     <= crop.tempMax)     match++;
    const pct = Math.round((match / 6) * 100);
    return { ...crop, compat: pct };
  }).sort((a, b) => b.compat - a.compat);
}
/**
 * Compute a planting risk score for a given forecast day × crop.
 */
function computeWeatherRisk(day, cropName) {
  const crop = CROP_DB.find(c => c.name === cropName);
  if (!crop) return { score: 0, label: 'Unknown', factors: [] };
  let score = 100;
  const factors = [];
  const condMap = {
    'Thunderstorm': { delta: -45, type: 'danger', text: '⛈️ Thunderstorm conditions — hazardous for sowing.' },
    'Heavy Rain':   { delta: -40, type: 'danger', text: '🌧️ Heavy rain increases seed wash-off and compaction.' },
    'Frost':        { delta: -60, type: 'danger', text: '❄️ Frost warning — severe seed and seedling kill risk.' },
    'Light Rain':   { delta: +10, type: 'ok',     text: '🌦️ Light rain is ideal for transplanting — reduces heat stress.' },
    'Cloudy':       { delta: +5,  type: 'ok',     text: '⛅ Overcast conditions reduce heat stress on seedlings.' },
    'Partly Cloudy':{ delta: +3,  type: 'ok',     text: '🌤️ Partly cloudy — mild conditions suitable for sowing.' }
  };
  if (condMap[day.condition]) {
    const { delta, type, text } = condMap[day.condition];
    score += delta;
    factors.push({ type, text });
  }
  if (day.tempMax > crop.tempMax) {
    score -= 25;
    factors.push({ type: 'danger', text: `🌡️ Forecast high (${day.tempMax}°C) exceeds ${crop.name} max (${crop.tempMax}°C).` });
  }
  if (day.tempMin < crop.tempMin) {
    score -= 30;
    factors.push({ type: 'danger', text: `🥶 Forecast low (${day.tempMin}°C) below ${crop.name} min (${crop.tempMin}°C).` });
  }
  if (day.windSpeed > 25) {
    score -= 20;
    factors.push({ type: 'warn', text: `💨 High winds (${day.windSpeed} km/h) unfavourable for seed establishment.` });
  }
  score = clamp(score, 0, 100);
  const label = score >= 80 ? 'Excellent' : score >= 50 ? 'Sub-optimal' : 'Hazardous — Avoid';
  if (factors.length === 0) {
    factors.push({ type: 'ok', text: '✅ No adverse conditions detected. Ideal for sowing.' });
  }
  return { score, label, factors };
}
/* ── Navigation ─────────────────────────────────────────────── */
function activateView(targetId) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(li => {
    li.classList.toggle('active', li.dataset.target === targetId);
  });
  // Update views
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === targetId);
  });
  // Update header title
  $('viewTitleHeader').textContent = VIEW_TITLES[targetId] || 'AgriCast';
  // Lazy-render views on first activation
  if (targetId === 'cropsView')     renderCrops();
  if (targetId === 'iotView')       renderIotTable();
  if (targetId === 'plannerView')   renderForecastDays();
}
/* ── Dashboard Live Updates ─────────────────────────────────── */
function updateDashboard() {
  // Soil metrics from live telemetry (slight drift)
  const ph   = round1(soilState.ph);
  const n    = Math.round(soilState.n);
  const p    = Math.round(soilState.p);
  const k    = Math.round(soilState.k);
  $('phValue').textContent = ph;
  $('nValue').textContent  = n;
  $('pValue').textContent  = p;
  $('kValue').textContent  = k;
  // Bar widths
  $('phBar').style.width = `${((ph - 3) / 7) * 100}%`;
  $('nBar').style.width  = `${(n / 200) * 100}%`;
  $('pBar').style.width  = `${(p / 150) * 100}%`;
  $('kBar').style.width  = `${(k / 200) * 100}%`;
  // Status labels
  $('phStatus').textContent  = ph >= 6.0 && ph <= 7.5 ? 'Optimal' : ph < 6.0 ? 'Acidic' : 'Alkaline';
  $('nStatus').textContent   = n >= 40 && n <= 140 ? 'Optimal' : n < 40 ? 'Low' : 'Excess';
  $('pStatus').textContent   = p >= 30 && p <= 90  ? 'Optimal' : p < 30 ? 'Low' : 'Excess';
  $('kStatus').textContent   = k >= 60 && k <= 160 ? 'Optimal' : k < 60 ? 'Low' : 'Excess';
  // Status badge classes
  function setBadgeClass(elId, val, min, max) {
    const el = $(elId);
    el.classList.remove('ok', 'warn', 'danger');
    el.classList.add(val >= min && val <= max ? 'ok' : (val < min * 0.6 || val > max * 1.4) ? 'danger' : 'warn');
  }
  setBadgeClass('phStatus', ph, 6.0, 7.5);
  setBadgeClass('nStatus',  n,  40,  140);
  setBadgeClass('pStatus',  p,  30,  90);
  setBadgeClass('kStatus',  k,  60,  160);
  // Telemetry
  $('teleMoisture').textContent = `${Math.round(telemetry.moisture)}%`;
  $('teleTemp').textContent     = `${round1(telemetry.temperature)}°C`;
  $('teleWind').textContent     = `${round1(telemetry.windSpeed)} km/h`;
  $('teleRain').textContent     = `${round1(telemetry.rainfall)} mm`;
  $('teleSolar').textContent    = `${Math.round(telemetry.solar)} µmol`;
  $('teleHumidity').textContent = `${Math.round(telemetry.humidity)}%`;
  // Clock
  $('currentTimePill').textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function renderWeatherStrip() {
  const strip = $('weatherStrip');
  strip.innerHTML = WEATHER_FORECAST.map(day => {
    const risk = computeWeatherRisk(day, 'Wheat');
    const badge = risk.score >= 80 ? 'ok' : risk.score >= 50 ? 'warn' : 'danger';
    return `
      <div class="weather-day-card" data-day="${day.day}" onclick="selectWeatherDay('${day.day}')">
        <div class="wd-day">${day.day} ${day.date}</div>
        <div class="wd-icon">${day.icon}</div>
        <div class="wd-temp">${day.tempMin}°–${day.tempMax}°C</div>
        <span class="wd-badge ${badge}">${risk.score}% Safe</span>
      </div>`;
  }).join('');
}
function selectWeatherDay(dayStr) {
  document.querySelectorAll('.weather-day-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.day === dayStr);
  });
}
/* ── Soil Analyzer ──────────────────────────────────────────── */
function runSoilAnalysis() {
  const ph       = parseFloat($('sliderPh').value);
  const n        = parseFloat($('sliderN').value);
  const p        = parseFloat($('sliderP').value);
  const k        = parseFloat($('sliderK').value);
  const moisture = parseFloat($('sliderMois').value);
  const temp     = parseFloat($('sliderTemp').value);
  const soilType = $('soilTypeSelect').value;
  const { score, grade, insights } = computeSoilScore({ ph, n, p, k, moisture, temp, soilType });
  // Score ring
  $('scoreNum').textContent   = score;
  $('scoreLabel').textContent = grade;
  const arc = $('scoreArc');
  const circumference = 2 * Math.PI * 50; // 314.16
  const offset = circumference - (score / 100) * circumference;
  arc.setAttribute('stroke-dashoffset', offset.toFixed(1));
  const color = score >= 85 ? '#15803d' : score >= 70 ? '#ca8a04' : score >= 50 ? '#ea580c' : '#dc2626';
  arc.setAttribute('stroke', color);
  // Insights
  $('insightsList').innerHTML = insights.map(i =>
    `<li class="insight ${i.type}">${i.text}</li>`
  ).join('');
}
function bindSliders() {
  const sliders = [
    { id: 'sliderPh',   display: 'sliderPhVal' },
    { id: 'sliderN',    display: 'sliderNVal' },
    { id: 'sliderP',    display: 'sliderPVal' },
    { id: 'sliderK',    display: 'sliderKVal' },
    { id: 'sliderMois', display: 'sliderMoisVal' },
    { id: 'sliderTemp', display: 'sliderTempVal' }
  ];
  sliders.forEach(({ id, display }) => {
    const slider = $(id);
    const label  = $(display);
    label.textContent = slider.value;
    slider.addEventListener('input', () => { label.textContent = slider.value; });
  });
  $('runSoilAnalysis').addEventListener('click', runSoilAnalysis);
  runSoilAnalysis(); // initial render
}
/* ── Crop Library ───────────────────────────────────────────── */
function renderCrops() {
  const params = {
    ph: soilState.ph, n: soilState.n, p: soilState.p, k: soilState.k,
    moisture: telemetry.moisture, temp: telemetry.temperature
  };
  const ranked = rankCrops(params);
  const grid = $('cropsGrid');
  grid.innerHTML = ranked.map((crop, i) => {
    const barColor = crop.compat >= 80 ? '#15803d' : crop.compat >= 50 ? '#ca8a04' : '#dc2626';
    const labelColor = crop.compat >= 80 ? 'color:#15803d' : crop.compat >= 50 ? 'color:#ca8a04' : 'color:#dc2626';
    return `
      <div class="crop-card ${i === 0 ? 'best-match' : ''}">
        ${i === 0 ? '<span class="status-badge ok" style="margin-bottom:8px;display:inline-flex">🏆 Best Match</span>' : ''}
        <div class="crop-emoji">${crop.emoji}</div>
        <div class="crop-name">${crop.name}</div>
        <span class="crop-type-badge">${crop.type}</span>
        <div class="crop-compat-bar-wrap">
          <div class="crop-compat-bar" style="width:${crop.compat}%;background:${barColor}"></div>
        </div>
        <div class="crop-compat-label" style="${labelColor}">${crop.compat}% Compatible</div>
        <div class="crop-stats">
          <span class="stat-chip">pH ${crop.phMin}–${crop.phMax}</span>
          <span class="stat-chip">N ${crop.nMin}–${crop.nMax}</span>
          <span class="stat-chip">P ${crop.pMin}–${crop.pMax}</span>
          <span class="stat-chip">K ${crop.kMin}–${crop.kMax}</span>
          <span class="stat-chip">💧 ${crop.moistureMin}–${crop.moistureMax}%</span>
          <span class="stat-chip">🕒 ${crop.growDays} days</span>
        </div>
        <p style="font-size:0.76rem;color:#78716c;margin-top:10px;line-height:1.5">${crop.desc}</p>
      </div>`;
  }).join('');
}
/* ── IoT Field Monitor ──────────────────────────────────────── */
function renderIotTable() {
  const total  = FIELD_DB.length;
  const alerts = FIELD_DB.filter(f => f.status === 'alert').length;
  const ok     = FIELD_DB.filter(f => f.status === 'ok').length;
  $('fieldsSummaryBar').innerHTML = `
    <span class="summary-pill total">📡 ${total} Fields</span>
    <span class="summary-pill ok">✅ ${ok} Normal</span>
    ${alerts > 0 ? `<span class="summary-pill alert">🚨 ${alerts} Alert${alerts > 1 ? 's' : ''}</span>` : ''}
  `;
  $('fieldsTableBody').innerHTML = FIELD_DB.map(f => {
    const statusHtml = f.status === 'alert'
      ? `<span class="status-badge alert">🚨 ${f.alertMsg || 'ALERT'}</span>`
      : f.status === 'warn'
      ? `<span class="status-badge warn">⚠️ ${f.alertMsg || 'Monitor'}</span>`
      : `<span class="status-badge ok">✅ Normal</span>`;
    return `
      <tr class="${f.status === 'alert' ? 'alert-row' : ''}">
        <td><strong>${f.name}</strong><br><small style="color:#78716c">${f.area}</small></td>
        <td>${f.crop}</td>
        <td>${f.moisture}%</td>
        <td>${f.temp}°C</td>
        <td>${f.ph}</td>
        <td>
          <span style="font-size:0.78rem">N:${f.n} / P:${f.p} / K:${f.k}</span>
        </td>
        <td>${statusHtml}</td>
      </tr>`;
  }).join('');
  $('iotSyncLabel').textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
}
/* ── Weather Planner ────────────────────────────────────────── */
function renderForecastDays() {
  const cropName = $('plannerCropSelect').value;
  const container = $('forecastDays');
  container.innerHTML = WEATHER_FORECAST.map((day, i) => {
    const risk = computeWeatherRisk(day, cropName);
    const isActive = selectedForecastDay === i;
    return `
      <button class="forecast-day-btn ${isActive ? 'active' : ''}" onclick="selectForecastDay(${i})">
        <div class="fd-day">${day.day}</div>
        <div class="fd-icon">${day.icon}</div>
        <div class="fd-temp">${day.tempMin}°–${day.tempMax}°</div>
        <div style="font-size:0.68rem;font-weight:700;color:${risk.score >= 80 ? '#15803d' : risk.score >= 50 ? '#ca8a04' : '#dc2626'}">${risk.score}%</div>
      </button>`;
  }).join('');
}
function selectForecastDay(index) {
  selectedForecastDay = index;
  const day      = WEATHER_FORECAST[index];
  const cropName = $('plannerCropSelect').value;
  const risk     = computeWeatherRisk(day, cropName);
  // Update circle
  const circle = $('riskCircle');
  const color  = risk.score >= 80 ? '#15803d' : risk.score >= 50 ? '#ca8a04' : '#dc2626';
  circle.style.borderColor = color;
  $('riskScoreNum').textContent  = risk.score;
  $('riskScoreNum').style.color  = color;
  $('riskScoreLabel').textContent = risk.label;
  // Update factors
  $('riskFactors').innerHTML = risk.factors.map(f =>
    `<li class="risk-factor ${f.type}">${f.text}</li>`
  ).join('');
  // Re-render buttons to show selected state
  renderForecastDays();
}
/* ── AI Advisor ─────────────────────────────────────────────── */
function appendChatMessage(role, html) {
  const window_ = $('chatWindow');
  const welcome = window_.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  const isUser = role === 'user';
  const msg = document.createElement('div');
  msg.className = `chat-message ${isUser ? 'user' : 'ai'}`;
  msg.innerHTML = `
    ${!isUser ? '<div class="chat-icon">🌿</div>' : ''}
    <div class="chat-bubble">${html}</div>
    ${isUser ? '<div class="chat-icon" style="background:#e7e5e4">👤</div>' : ''}
  `;
  window_.appendChild(msg);
  window_.scrollTop = window_.scrollHeight;
  return msg;
}
function showTyping() {
  const window_ = $('chatWindow');
  const typing = document.createElement('div');
  typing.className = 'chat-message ai';
  typing.id = 'typingIndicator';
  typing.innerHTML = `
    <div class="chat-icon">🌿</div>
    <div class="typing-indicator">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
  window_.appendChild(typing);
  window_.scrollTop = window_.scrollHeight;
}
function removeTyping() {
  const t = $('typingIndicator');
  if (t) t.remove();
}
/**
 * Build a context string from live telemetry and soil state.
 */
function buildContextString() {
  return [
    `Soil pH: ${round1(soilState.ph)}`,
    `Nitrogen: ${Math.round(soilState.n)} mg/kg`,
    `Phosphorus: ${Math.round(soilState.p)} mg/kg`,
    `Potassium: ${Math.round(soilState.k)} mg/kg`,
    `Soil Moisture: ${Math.round(telemetry.moisture)}%`,
    `Soil Temperature: ${round1(telemetry.temperature)}°C`,
    `Wind Speed: ${round1(telemetry.windSpeed)} km/h`,
    `Humidity: ${Math.round(telemetry.humidity)}%`,
    `Rainfall: ${round1(telemetry.rainfall)} mm`,
  ].join(' | ');
}
/**
 * Simulated ReAct reasoning chain for offline AI mode.
 */
function simulateAgriAgent(question) {
  const q = question.toLowerCase();
  const ctx = buildContextString();
  const ph   = round1(soilState.ph);
  const n    = Math.round(soilState.n);
  const moisture = Math.round(telemetry.moisture);
  const ranked = rankCrops({
    ph: soilState.ph, n: soilState.n, p: soilState.p, k: soilState.k,
    moisture: telemetry.moisture, temp: telemetry.temperature
  });
  const top = ranked[0];
  const { score, grade, insights } = computeSoilScore({
    ph: soilState.ph, n: soilState.n, p: soilState.p, k: soilState.k,
    moisture: telemetry.moisture, temp: telemetry.temperature
  });
  let reasoning = '';
  let answer    = '';
  if (q.includes('soil') || q.includes('health') || q.includes('diagnostic') || q.includes('ph') || q.includes('npk')) {
    reasoning = `🤔 Thought: User asked about soil health. I'll call analyze_soil() with live field data.
🔧 Tool: analyze_soil(ph=${ph}, N=${n}, P=${Math.round(soilState.p)}, K=${Math.round(soilState.k)}, moisture=${moisture}%)
📊 Result: Score ${score}/100 — ${grade}`;
    answer = `<strong>Soil Health Assessment</strong><br><br>
Score: <strong>${score}/100 — ${grade}</strong><br><br>
${insights.map(i => `• ${i.text}`).join('<br>')}`;
  } else if (q.includes('crop') || q.includes('plant') || q.includes('sow') || q.includes('grow') || q.includes('recommend')) {
    reasoning = `🤔 Thought: User wants crop recommendations. I'll call recommend_crop() with live soil values.
🔧 Tool: recommend_crop(ph=${ph}, N=${n}, moisture=${moisture}%)
📊 Result: Top match is ${top.name} at ${top.compat}% compatibility.`;
    answer = `<strong>Crop Recommendations</strong><br><br>
Based on your current soil conditions:<br><br>
${ranked.slice(0, 3).map((c, i) => `<strong>${i + 1}. ${c.emoji} ${c.name}</strong> — ${c.compat}% compatible<br>&nbsp;&nbsp;&nbsp;${c.desc}`).join('<br><br>')}`;
  } else if (q.includes('irrig') || q.includes('water') || q.includes('moisture')) {
    const urgency = moisture < 30 ? 'CRITICAL' : moisture < 40 ? 'HIGH' : moisture > 80 ? 'HIGH' : 'None';
    reasoning = `🤔 Thought: User asked about irrigation. I'll call get_irrigation_plan() for all fields.
🔧 Tool: get_irrigation_plan(moisture=${moisture}%, temp=${round1(telemetry.temperature)}°C)
📊 Result: Urgency — ${urgency}`;
    answer = `<strong>Irrigation Plan</strong><br><br>
Current Moisture: <strong>${moisture}%</strong><br>
Urgency: <strong style="color:${urgency === 'CRITICAL' ? '#dc2626' : urgency === 'HIGH' ? '#ca8a04' : '#15803d'}">${urgency}</strong><br><br>
${moisture < 35
  ? '🚨 <strong>Immediate action required!</strong> Initiate deep drip irrigation. Fields below 35% moisture risk permanent crop stress.'
  : moisture > 80
  ? '🌊 <strong>Suspend all irrigation.</strong> Waterlogging detected. Check field drainage channels immediately.'
  : '✅ Moisture is within acceptable range. Maintain current irrigation schedule.'}
<br><br><strong>North Paddock Alert:</strong> 18% moisture — irrigate within the next 2 hours.`;
  } else if (q.includes('weather') || q.includes('rain') || q.includes('forecast') || q.includes('risk')) {
    const day = WEATHER_FORECAST[0];
    const risk = computeWeatherRisk(day, 'Wheat');
    reasoning = `🤔 Thought: User asked about weather risk. I'll call assess_weather_risk() for today.
🔧 Tool: assess_weather_risk(condition=${day.condition}, tempMax=${day.tempMax}°C, wind=${day.windSpeed} km/h)
📊 Result: Planting rating ${risk.score}/100 — ${risk.label}`;
    answer = `<strong>Weather & Planting Risk</strong><br><br>
Today's Forecast: ${day.icon} <strong>${day.condition}</strong> | ${day.tempMin}°–${day.tempMax}°C | Wind: ${day.windSpeed} km/h<br><br>
Planting Safety: <strong>${risk.score}/100 — ${risk.label}</strong><br><br>
${risk.factors.map(f => `• ${f.text}`).join('<br>')}`;
  } else {
    reasoning = `🤔 Thought: General agronomic question. Synthesising field context.
🔧 Tool: get_current_date() + analyze_soil() + recommend_crop()
📊 Context: ${ctx}`;
    answer = `<strong>AgriAgent Response</strong><br><br>
Based on your current field conditions:<br><br>
• <strong>Soil Health:</strong> ${score}/100 (${grade}) — pH ${ph}, N:${n} mg/kg<br>
• <strong>Best Crop Match:</strong> ${top.emoji} ${top.name} (${top.compat}% compatible)<br>
• <strong>Moisture:</strong> ${moisture}% — ${moisture < 40 ? '⚠️ Schedule irrigation soon' : '✅ Within range'}<br>
• <strong>Today's Weather:</strong> ${WEATHER_FORECAST[0].icon} ${WEATHER_FORECAST[0].condition}<br><br>
Use the quick-action buttons above for specific diagnostics.`;
  }
  return { reasoning, answer };
}
/**
 * Send a message — either to simulated agent or Gemini REST API.
 */
async function sendMessage() {
  const input   = $('chatInput');
  const question = input.value.trim();
  if (!question) return;
  input.value = '';
  input.style.height = 'auto';
  appendChatMessage('user', question);
  showTyping();
  await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
  if (useGeminiApi && geminiApiKey) {
    // Live Gemini API call
    try {
      const systemPrompt = `You are AgriAgent, an expert AI Agronomist. Current field conditions: ${buildContextString()}. Give concise, actionable agricultural advice.`;
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${question}` }] }]
          })
        }
      );
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from API.';
      removeTyping();
      appendChatMessage('ai', text.replace(/\n/g, '<br>'));
    } catch (e) {
      removeTyping();
      appendChatMessage('ai', `❌ API Error: ${e.message}. Switching to simulated mode.`);
    }
  } else {
    // Simulated offline AI
    const { reasoning, answer } = simulateAgriAgent(question);
    removeTyping();
    const html = `${answer}
      <div class="reasoning-block">ReAct Chain:\n${reasoning}</div>`;
    appendChatMessage('ai', html);
  }
}
/* ── API Config ─────────────────────────────────────────────── */
function bindApiConfig() {
  $('apiToggleBtn').addEventListener('click', () => {
    const panel = $('apiConfigPanel');
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  });
  $('saveApiKey').addEventListener('click', () => {
    const key = $('geminiKeyInput').value.trim();
    if (key) {
      geminiApiKey = key;
      useGeminiApi = true;
      $('apiModeLabel').textContent = '✅ Mode: Live Gemini AI';
      $('apiConfigPanel').style.display = 'none';
    }
  });
}
/* ── Bootstrap ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(li => {
    li.addEventListener('click', () => activateView(li.dataset.target));
  });
  // Dashboard
  renderWeatherStrip();
  updateDashboard();
  setInterval(updateDashboard, 4200);
  // Soil Analyzer
  bindSliders();
  // Planner crop selector
  $('plannerCropSelect').addEventListener('change', () => {
    renderForecastDays();
    selectedForecastDay = null;
    $('riskScoreNum').textContent   = '—';
    $('riskScoreLabel').textContent = 'Select a day';
    $('riskFactors').innerHTML = `<li class="risk-factor neutral">👆 Click a forecast day above to analyse planting risk.</li>`;
    $('riskCircle').style.borderColor = '#e7e5e4';
  });
  // Chat input
  $('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  $('chatInput').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
  $('sendBtn').addEventListener('click', sendMessage);
  // Quick action buttons
  document.querySelectorAll('.qa-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $('chatInput').value = btn.dataset.prompt;
      sendMessage();
    });
  });
  // API config
  bindApiConfig();
  // Expose selectForecastDay globally for inline onclick
  window.selectForecastDay = selectForecastDay;
  window.selectWeatherDay  = selectWeatherDay;
});
