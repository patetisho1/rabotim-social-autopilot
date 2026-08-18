const config = require("../config");
const logger = require("../logger");

/**
 * Изтегля "истински" данни от Rabotim за деня — последна завършена услуга, топ отзив,
 * седмична статистика или топ категория. Това НЕ е готов ендпойнт — трябва самите вие
 * да изложите лек JSON API от бекенда на rabotim.com (или view в базата), който връща
 * нещо от този вид:
 *
 * GET {RABOTIM_STATS_ENDPOINT}?kind=recent_completed_job
 * {
 *   "category": "Почистване",
 *   "city": "София",
 *   "summary": "Основно почистване на 3-стаен апартамент за 4 часа",
 *   "beforeImageUrl": "https://.../before.jpg",   // по избор
 *   "afterImageUrl": "https://.../after.jpg"      // по избор
 * }
 *
 * GET ...?kind=top_review
 * { "category": "Ремонт", "rating": 5, "text": "...", "authorFirstName": "Иван" }
 *
 * GET ...?kind=weekly_stats
 * { "requestsThisWeek": 128, "categoriesTop3": ["Почистване", "Ремонт", "Преместване"] }
 *
 * GET ...?kind=top_category
 * { "category": "Градинарство", "requestsThisWeek": 22 }
 *
 * Докато този ендпойнт не съществува, функцията просто връща null и пайплайнът
 * пада обратно на чист AI/шаблонен текст (виж contentMixer.js).
 */
async function fetchRealData(kind) {
  if (!config.rabotim.statsEndpoint) {
    logger.info(`[rabotimData] RABOTIM_STATS_ENDPOINT не е зададен — пропускам реални данни за "${kind}"`);
    return null;
  }
  try {
    const url = `${config.rabotim.statsEndpoint}?kind=${encodeURIComponent(kind)}`;
    const res = await fetch(url, {
      headers: config.rabotim.statsApiKey ? { Authorization: `Bearer ${config.rabotim.statsApiKey}` } : {},
    });
    if (!res.ok) {
      logger.warn(`[rabotimData] ${kind}: HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    logger.warn(`[rabotimData] Грешка при извличане на "${kind}":`, e.message);
    return null;
  }
}

module.exports = { fetchRealData };
