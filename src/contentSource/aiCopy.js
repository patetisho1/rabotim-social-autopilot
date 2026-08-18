const config = require("../config");
const logger = require("../logger");

const SYSTEM_PROMPT = `Ти пишеш кратки, топли, конкретни постове на български за Facebook/Instagram/TikTok
за Rabotim.com — платформа за намиране на проверени изпълнители на локални услуги в България
(ремонт, почистване, преместване, доставка, обучение, градинарство, IT услуги).

Тон: приятелски, директен, без корпоративен жаргон, без излишни емоджита (най-много 1-2).
Дължина: 2-4 изречения текст + 1 ясен призив за действие (CTA) + 3-5 relevant хаштага в края.
Никога не измисляй конкретни числа, имена на клиенти или отзиви, ако не са ти дадени като данни —
в такъв случай пиши на общо ниво (без фалшива конкретика).
Връщай САМО готовия текст на поста, без обяснения, без markdown, без кавички около текста.`;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function templateFallback(theme, realData) {
  // Локален fallback без AI повикване — гарантира, че пайплайнът никога не спира
  // само защото липсва/failне ANTHROPIC_API_KEY.
  const topic = pickRandom(theme.fallbackTopics);
  const ctas = [
    "Заяви услуга за 2 минути на rabotim.com.",
    "Разгледай проверени изпълнители на rabotim.com.",
    "Провери кой е свободен тази седмица на rabotim.com.",
  ];
  const hashtags = "#rabotim #услугивкъщи #майстор #софия #българия";

  if (realData && theme.dataKind === "weekly_stats" && realData.requestsThisWeek) {
    return `Тази седмица още ${realData.requestsThisWeek} души намериха проверен изпълнител през Rabotim. ${pickRandom(ctas)}\n\n${hashtags}`;
  }
  if (realData && theme.dataKind === "top_category" && realData.category) {
    return `Тази седмица най-търсена категория е "${realData.category}". Ако и ти имаш нужда — сега е моментът. ${pickRandom(ctas)}\n\n${hashtags}`;
  }
  if (realData && theme.dataKind === "top_review" && realData.text) {
    return `"${realData.text}" — реален отзив от клиент за категория ${realData.category || "услуга"}. ${pickRandom(ctas)}\n\n${hashtags}`;
  }
  if (realData && theme.dataKind === "recent_completed_job" && realData.summary) {
    return `${realData.summary} — свършена работа през Rabotim (${realData.city || "България"}). ${pickRandom(ctas)}\n\n${hashtags}`;
  }
  return `${topic}. ${pickRandom(ctas)}\n\n${hashtags}`;
}

async function callClaude(theme, realData) {
  const dataBlock = realData
    ? `Реални данни за днешния пост (използвай ги буквално, не измисляй допълнителни детайли):\n${JSON.stringify(realData, null, 2)}`
    : `Няма реални данни за днес — избери една от тези теми и развий я:\n- ${theme.fallbackTopics.join("\n- ")}`;

  const body = {
    model: config.anthropic.model,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Формат на поста: "${theme.label}".\n${dataBlock}`,
      },
    ],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic API HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const json = await res.json();
  const text = json?.content?.[0]?.text?.trim();
  if (!text) throw new Error("Anthropic API върна празен отговор");
  return text;
}

/**
 * Връща готов текст на пост за дадена тема + (по избор) реални данни.
 * Опитва AI генерация ако има API ключ; при липса/грешка пада на локален шаблон.
 */
async function generateCaption(theme, realData) {
  if (config.anthropic.apiKey) {
    try {
      return await callClaude(theme, realData);
    } catch (e) {
      logger.warn("[aiCopy] AI генерация неуспешна, ползвам fallback шаблон:", e.message);
    }
  } else {
    logger.info("[aiCopy] ANTHROPIC_API_KEY не е зададен — ползвам локален шаблон.");
  }
  return templateFallback(theme, realData);
}

module.exports = { generateCaption };
