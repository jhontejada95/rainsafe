// weather.js — Open-Meteo API client (no API key required)

const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

/**
 * Get rainfall data for a location for the last N days
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} days - number of past days to fetch
 */
async function getRainfallHistory(latitude, longitude, days = 7) {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 86400000)
    .toISOString()
    .split("T")[0];

  const url = new URL(ARCHIVE_URL);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();

  return {
    dates: data.daily.time,
    precipitation: data.daily.precipitation_sum, // mm per day
    total: data.daily.precipitation_sum.reduce((a, b) => a + (b || 0), 0),
    average: data.daily.precipitation_sum.reduce((a, b) => a + (b || 0), 0) / days,
  };
}

/**
 * Get current + 7-day forecast
 */
async function getForecast(latitude, longitude) {
  const url = new URL(BASE_URL);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("daily", "precipitation_sum,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo forecast error: ${res.status}`);
  return res.json();
}

/**
 * Evaluate climate condition for a farm location
 * Returns: { status, eventType, totalMm, riskLevel }
 */
async function evaluateClimateCondition(latitude, longitude) {
  const history = await getRainfallHistory(latitude, longitude, 7);
  const forecast = await getForecast(latitude, longitude);

  const DROUGHT_THRESHOLD = 5;   // mm in 7 days
  const FLOOD_THRESHOLD = 150;   // mm in 24h

  let status = "normal";
  let eventType = null;
  let riskLevel = "low";

  // Check drought
  if (history.total < DROUGHT_THRESHOLD) {
    status = "alert";
    eventType = "drought";
    riskLevel = "critical";
  }

  // Check flood (any single day > threshold)
  const maxDaily = history.precipitation.reduce((max, v) => Math.max(max, v ?? 0), 0);
  if (maxDaily > FLOOD_THRESHOLD) {
    status = "alert";
    eventType = "flood";
    riskLevel = "critical";
  }

  // Medium risk warnings
  if (history.total < 15 && status === "normal") {
    status = "warning";
    riskLevel = "medium";
  }

  return {
    status,
    eventType,
    riskLevel,
    totalMm: history.total,
    averageDailyMm: history.average,
    dailyData: history,
    forecast: forecast.daily,
  };
}

module.exports = { getRainfallHistory, getForecast, evaluateClimateCondition };
