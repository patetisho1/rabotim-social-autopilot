const { themeForDate } = require("./contentSource/themes");
const { fetchRealData } = require("./contentSource/rabotimData");
const { generateCaption } = require("./contentSource/aiCopy");
const logger = require("./logger");

/**
 * Събира всичко нужно за днешния пост: тема на деня, реални данни (ако има),
 * генерирания текст, и кратко "headline" за визуала (по-кратко от целия caption).
 */
async function buildTodaysContent(date = new Date()) {
  const theme = themeForDate(date);
  logger.info(`[contentMixer] Тема за днес (${date.toDateString()}): ${theme.label} (${theme.key})`);

  let realData = null;
  if (theme.wantsRealData) {
    realData = await fetchRealData(theme.dataKind);
    logger.info(`[contentMixer] Реални данни: ${realData ? "намерени" : "няма — fallback на AI/шаблон"}`);
  }

  const caption = await generateCaption(theme, realData);
  const headline = buildHeadline(theme, realData);

  return { theme, realData, caption, headline };
}

function buildHeadline(theme, realData) {
  if (realData?.category) return realData.category;
  if (theme.key === "tip") return "Съвет от Rabotim";
  if (theme.key === "explainer") return "Как работи Rabotim";
  if (theme.key === "offer_cta") return "Заяви услуга днес";
  return theme.label;
}

module.exports = { buildTodaysContent };
