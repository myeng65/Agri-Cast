# ruff: noqa
# Copyright 2026 Google LLC
#
# limitations under the License.
import datetime
from zoneinfo import ZoneInfo
import json
import os
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types
import os
import google.auth
# Configure Vertex AI or Google AI Studio depending on environment
_use_vertex = os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").upper() == "TRUE"
if not _use_vertex:
    # Default: use Google AI Studio key-based auth (no GCP project required)
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "False")
_, project_id = google.auth.default()
os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
os.environ["GOOGLE_CLOUD_LOCATION"] = "global"
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"
# ---------------------------------------------------------------------------
# AgriCast Tool Definitions
# ---------------------------------------------------------------------------
def get_weather(query: str) -> str:
    """Simulates a web search. Use it get information on weather.
# Simulated crop database (mirrors mock-db.js in the frontend)
CROP_DB = [
    {
        "id": "wheat", "name": "Wheat", "type": "Grain",
        "phMin": 6.0, "phMax": 7.0,
        "nMin": 40, "nMax": 70, "pMin": 30, "pMax": 50, "kMin": 50, "kMax": 80,
        "moistureMin": 30, "moistureMax": 55, "tempMin": 10, "tempMax": 24, "growDays": 120,
    },
    {
        "id": "corn", "name": "Maize (Corn)", "type": "Grain",
        "phMin": 5.8, "phMax": 7.0,
        "nMin": 80, "nMax": 120, "pMin": 40, "pMax": 70, "kMin": 80, "kMax": 120,
        "moistureMin": 45, "moistureMax": 70, "tempMin": 16, "tempMax": 32, "growDays": 100,
    },
    {
        "id": "soybean", "name": "Soybeans", "type": "Legume",
        "phMin": 6.0, "phMax": 6.8,
        "nMin": 20, "nMax": 40, "pMin": 30, "pMax": 60, "kMin": 60, "kMax": 90,
        "moistureMin": 40, "moistureMax": 65, "tempMin": 15, "tempMax": 27, "growDays": 110,
    },
    {
        "id": "potato", "name": "Potato", "type": "Tuber",
        "phMin": 5.0, "phMax": 6.0,
        "nMin": 60, "nMax": 90, "pMin": 50, "pMax": 80, "kMin": 90, "kMax": 140,
        "moistureMin": 50, "moistureMax": 70, "tempMin": 7, "tempMax": 21, "growDays": 90,
    },
    {
        "id": "tomato", "name": "Tomato", "type": "Vegetable",
        "phMin": 6.0, "phMax": 6.8,
        "nMin": 70, "nMax": 100, "pMin": 50, "pMax": 80, "kMin": 80, "kMax": 130,
        "moistureMin": 55, "moistureMax": 75, "tempMin": 18, "tempMax": 29, "growDays": 75,
    },
    {
        "id": "rice", "name": "Rice", "type": "Grain",
        "phMin": 5.5, "phMax": 6.5,
        "nMin": 60, "nMax": 100, "pMin": 30, "pMax": 50, "kMin": 40, "kMax": 70,
        "moistureMin": 75, "moistureMax": 95, "tempMin": 20, "tempMax": 35, "growDays": 130,
    },
    {
        "id": "strawberry", "name": "Strawberry", "type": "Fruit",
        "phMin": 5.5, "phMax": 6.5,
        "nMin": 40, "nMax": 60, "pMin": 40, "pMax": 60, "kMin": 60, "kMax": 90,
        "moistureMin": 50, "moistureMax": 70, "tempMin": 13, "tempMax": 25, "growDays": 60,
    },
]
def analyze_soil(
    ph: float,
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    moisture: float,
    temperature: float,
    soil_type: str = "loam",
) -> str:
    """Analyze current soil parameters and return a health score with diagnostic insights.
    Args:
        query: A string containing the location to get weather information for.
        ph: Soil pH level (3.0 to 10.0).
        nitrogen: Nitrogen content in mg/kg.
        phosphorus: Phosphorus content in mg/kg.
        potassium: Potassium content in mg/kg.
        moisture: Soil moisture percentage (0-100).
        temperature: Soil temperature in Celsius.
        soil_type: Texture type - loam, clay, sand, silt, or peat.
    Returns:
        A string with the simulated weather information for the queried location.
        JSON string with health score, grade, and list of diagnostic insights.
    """
    if "sf" in query.lower() or "san francisco" in query.lower():
        return "It's 60 degrees and foggy."
    return "It's 90 degrees and sunny."
    score = 100
    issues = []
    # pH assessment (ordered from extreme → moderate, both sides)
    if ph < 5.5:
        score -= 25
        issues.append(f"CRITICAL: pH {ph} is severely acidic. Apply agricultural lime immediately.")
    elif ph < 6.0:
        score -= 12
        issues.append(f"WARNING: pH {ph} is acidic. Consider liming to raise towards 6.5.")
    elif ph > 8.5:
        score -= 35
        issues.append(f"CRITICAL: pH {ph} is severely alkaline — iron/manganese lockout risk. Apply elemental sulfur urgently.")
    elif ph > 7.5:
        score -= 12
        issues.append(f"WARNING: pH {ph} is alkaline. Apply elemental sulfur or organic compost.")
def get_current_time(query: str) -> str:
    """Simulates getting the current time for a city.
    # NPK assessment
    if nitrogen < 40:
        score -= 15
        issues.append(f"LOW N ({nitrogen} mg/kg): Apply ammonium nitrate or blood meal.")
    elif nitrogen > 140:
        score -= 8
        issues.append(f"EXCESS N ({nitrogen} mg/kg): Reduce nitrogen applications — leaching risk.")
    if phosphorus < 30:
        score -= 15
        issues.append(f"LOW P ({phosphorus} mg/kg): Apply bone meal or triple superphosphate.")
    elif phosphorus > 90:
        score -= 8
        issues.append(f"EXCESS P ({phosphorus} mg/kg): Suspend phosphorus fertilisation.")
    if potassium < 60:
        score -= 15
        issues.append(f"LOW K ({potassium} mg/kg): Top-dress with potash or greensand.")
    elif potassium > 160:
        score -= 8
        issues.append(f"EXCESS K ({potassium} mg/kg): Reduce potassium input — salt stress risk.")
    # Moisture assessment
    if moisture < 35:
        score -= 15
        issues.append(f"DRY ALERT ({moisture}%): Initiate deep irrigation cycle immediately.")
    elif moisture > 80:
        score -= 12
        issues.append(f"WATERLOGGED ({moisture}%): Suspend irrigation, check field drainage.")
    # Soil type note
    type_notes = {
        "clay": "Clay texture: heavy compaction risk above 60% moisture. Avoid machinery.",
        "sand": "Sandy texture: apply split-dose fertilisers to reduce nutrient leaching.",
        "peat": "Peaty soil: naturally acidic and high in organic carbon — monitor pH closely.",
        "silt": "Silt texture: highly fertile but prone to surface crust and erosion.",
        "loam": "Loam texture: excellent balanced structure for most crops.",
    }
    if soil_type in type_notes:
        issues.append(f"SOIL TYPE: {type_notes[soil_type]}")
    score = max(0, min(100, score))
    grade = "Excellent" if score >= 85 else "Good" if score >= 70 else "Fair" if score >= 50 else "Poor"
    result = {
        "health_score": score,
        "grade": grade,
        "ph": ph,
        "nitrogen": nitrogen,
        "phosphorus": phosphorus,
        "potassium": potassium,
        "moisture": moisture,
        "temperature": temperature,
        "soil_type": soil_type,
        "insights": issues if issues else ["All soil parameters are within optimal ranges. No action required."],
    }
    return json.dumps(result, indent=2)
def recommend_crop(
    ph: float,
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    moisture: float,
    temperature: float,
) -> str:
    """Recommend the best matching crop(s) for the given soil conditions.
    Args:
        city: The name of the city to get the current time for.
        ph: Current soil pH.
        nitrogen: Soil nitrogen in mg/kg.
        phosphorus: Soil phosphorus in mg/kg.
        potassium: Soil potassium in mg/kg.
        moisture: Soil moisture percentage.
        temperature: Soil temperature in Celsius.
    Returns:
        A string with the current time information.
        JSON string listing top 3 compatible crops ranked by compatibility score.
    """
    if "sf" in query.lower() or "san francisco" in query.lower():
        tz_identifier = "America/Los_Angeles"
    soil = {"ph": ph, "n": nitrogen, "p": phosphorus, "k": potassium,
            "moisture": moisture, "temp": temperature}
    ranked = []
    for crop in CROP_DB:
        score = 0
        params = 6
        if crop["phMin"] <= soil["ph"] <= crop["phMax"]:
            score += 1
        if crop["nMin"] <= soil["n"] <= crop["nMax"]:
            score += 1
        if crop["pMin"] <= soil["p"] <= crop["pMax"]:
            score += 1
        if crop["kMin"] <= soil["k"] <= crop["kMax"]:
            score += 1
        if crop["moistureMin"] <= soil["moisture"] <= crop["moistureMax"]:
            score += 1
        if crop["tempMin"] <= soil["temp"] <= crop["tempMax"]:
            score += 1
        pct = round((score / params) * 100)
        status = "Excellent Match" if pct >= 80 else "Moderate Suitability" if pct >= 50 else "Poor Match"
        ranked.append({
            "crop": crop["name"],
            "type": crop["type"],
            "compatibility_pct": pct,
            "status": status,
            "grow_days": crop["growDays"],
        })
    ranked.sort(key=lambda x: x["compatibility_pct"], reverse=True)
    return json.dumps({"top_recommendations": ranked[:3]}, indent=2)
def assess_weather_risk(
    region: str,
    crop_name: str,
    temp_min: float,
    temp_max: float,
    wind_speed: float,
    condition: str,
) -> str:
    """Assess planting suitability risk for a given weather forecast day and crop.
    Args:
        region: Climate region - temperate, tropical, arid, or mediterranean.
        crop_name: Name of the target crop (e.g. "Wheat", "Tomato").
        temp_min: Forecast minimum temperature in Celsius.
        temp_max: Forecast maximum temperature in Celsius.
        wind_speed: Forecast wind speed in km/h.
        condition: Weather condition - Sunny, Cloudy, Light Rain, Heavy Rain, Thunderstorm, Frost.
    Returns:
        JSON string with planting rating (0-100), risk label, and list of risk factors.
    """
    crop = next((c for c in CROP_DB if c["name"].lower() == crop_name.lower()), None)
    if not crop:
        return json.dumps({"error": f"Crop '{crop_name}' not found in database."})
    rating = 100
    risks = []
    condition_map = {
        "Heavy Rain": (-40, "Heavy rainfall increases seed wash-off and soil compaction."),
        "Thunderstorm": (-40, "Thunderstorm conditions pose severe sowing risks."),
        "Frost": (-60, "Frost warning — severe seed and seedling kill risk."),
        "Light Rain": (+10, "Light rain is ideal for transplanting — reduces transplant shock."),
        "Cloudy": (+5, "Overcast conditions reduce heat stress on seedlings."),
    }
    if condition in condition_map:
        delta, msg = condition_map[condition]
        rating += delta
        risks.append(msg)
    if temp_max > crop["tempMax"]:
        rating -= 25
        risks.append(f"Forecast high ({temp_max}°C) exceeds {crop['name']} threshold ({crop['tempMax']}°C).")
    if temp_min < crop["tempMin"]:
        rating -= 30
        risks.append(f"Forecast low ({temp_min}°C) is colder than {crop['name']} minimum ({crop['tempMin']}°C).")
    if wind_speed > 25:
        rating -= 20
        risks.append(f"High winds ({wind_speed} km/h) — unfavourable for seed sowing and seedling establishment.")
    rating = max(0, min(100, rating))
    label = "Excellent" if rating >= 80 else "Sub-optimal" if rating >= 40 else "Hazardous — Avoid"
    return json.dumps({
        "crop": crop_name,
        "region": region,
        "planting_rating": rating,
        "label": label,
        "condition": condition,
        "temp_min": temp_min,
        "temp_max": temp_max,
        "wind_speed": wind_speed,
        "risk_factors": risks if risks else ["No adverse weather risks detected. Conditions are optimal for sowing."],
    }, indent=2)
def get_irrigation_plan(
    field_name: str,
    moisture_pct: float,
    temperature: float,
    crop_name: str,
) -> str:
    """Generate an irrigation and fertilisation recommendation for a specific field.
    Args:
        field_name: Name of the field (e.g. 'East Acre', 'West Ridge').
        moisture_pct: Current soil moisture percentage from IoT telemetry.
        temperature: Current soil temperature in Celsius.
        crop_name: Target crop being grown in the field.
    Returns:
        JSON string with irrigation action, urgency level, and treatment notes.
    """
    crop = next((c for c in CROP_DB if c["name"].lower() == crop_name.lower()), None)
    moisture_min = crop["moistureMin"] if crop else 40
    moisture_max = crop["moistureMax"] if crop else 70
    urgency = "None"
    actions = []
    if moisture_pct < moisture_min - 10:
        urgency = "CRITICAL"
        actions.append(f"Initiate deep drip irrigation immediately — moisture at {moisture_pct:.1f}% (critical threshold).")
    elif moisture_pct < moisture_min:
        urgency = "HIGH"
        actions.append(f"Schedule irrigation within 6 hours — moisture at {moisture_pct:.1f}% below target range ({moisture_min}%-{moisture_max}%).")
    elif moisture_pct > moisture_max + 10:
        urgency = "HIGH"
        actions.append(f"Suspend all irrigation — waterlogging risk at {moisture_pct:.1f}%. Check drainage channels.")
    elif moisture_pct > moisture_max:
        urgency = "MODERATE"
        actions.append(f"Reduce irrigation frequency — moisture at {moisture_pct:.1f}% above optimal range.")
    else:
        return f"Sorry, I don't have timezone information for query: {query}."
        actions.append(f"Moisture at {moisture_pct:.1f}% is within optimal range ({moisture_min}%-{moisture_max}%). Maintain current schedule.")
    tz = ZoneInfo(tz_identifier)
    now = datetime.datetime.now(tz)
    return f"The current time for query {query} is {now.strftime('%Y-%m-%d %H:%M:%S %Z%z')}"
    if temperature < 10:
        actions.append(f"Soil temperature ({temperature}°C) is low — avoid irrigation to prevent frost damage to roots.")
    elif temperature > 35:
        actions.append(f"High soil temperature ({temperature}°C) — irrigate in early morning or evening to minimise evaporation.")
    return json.dumps({
        "field": field_name,
        "crop": crop_name if crop else "Unknown",
        "current_moisture": moisture_pct,
        "optimal_moisture_range": f"{moisture_min}%-{moisture_max}%",
        "current_temperature": temperature,
        "irrigation_urgency": urgency,
        "recommended_actions": actions,
    }, indent=2)
def get_current_date() -> str:
    """Return the current date and time (UTC).
    Returns:
        A string with the current ISO date and time.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    return f"Current date and time (UTC): {now.strftime('%Y-%m-%d %H:%M:%S %Z')}"
# ---------------------------------------------------------------------------
# AgriCast Agent Definition
# ---------------------------------------------------------------------------
root_agent = Agent(
    name="root_agent",
    name="agricast_agriagent",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="You are a helpful AI assistant designed to provide accurate and useful information.",
    tools=[get_weather, get_current_time],
    instruction="""You are AgriAgent, an expert AI Agronomist and precision farming decision-support assistant for the AgriCast platform.
Your role is to help farmers make data-driven decisions about:
- Soil health diagnostics and nutrient management (N, P, K, pH)
- Crop variety selection and compatibility matching
- Planting suitability and weather risk assessment
- Irrigation scheduling and fertilisation planning
- IoT field sensor telemetry interpretation
TOOLS AVAILABLE:
- analyze_soil: Run a full soil health diagnostic
- recommend_crop: Match the best crops to current soil conditions
- assess_weather_risk: Evaluate planting risk for a given forecast day
- get_irrigation_plan: Generate an irrigation/treatment plan for a field
- get_current_date: Get the current date and time
RESPONSE GUIDELINES:
1. Always use your tools to gather data before making recommendations.
2. Be precise, professional, and actionable — give specific quantities and timing.
3. When soil issues are detected, provide concrete remediation steps.
4. Prioritise safety: always warn about critical frost, drought, or waterlogging risks.
5. Keep responses concise but complete. Use bullet points for action items.
""",
    tools=[
        analyze_soil,
        recommend_crop,
        assess_weather_risk,
        get_irrigation_plan,
        get_current_date,
    ],
)
app = App(
    root_agent=root_agent,
    name="app",
    name="agricast_app",
)
