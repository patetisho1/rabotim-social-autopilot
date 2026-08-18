const config = require("../config");
const logger = require("../logger");

const GRAPH_VERSION = "v21.0"; // Провери за по-нова версия преди да пуснеш в продукция.
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function graphPost(endpoint, params) {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Graph API грешка (${endpoint}): ${JSON.stringify(json.error || json)}`);
  }
  return json;
}

async function graphGet(endpoint, params) {
  const url = `${BASE}/${endpoint}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Graph API грешка (GET ${endpoint}): ${JSON.stringify(json.error || json)}`);
  }
  return json;
}

/**
 * Публикува снимка + текст на Facebook страницата.
 * imageUrl трябва да е публично достъпен URL (виж hosting/publicAssetHost.js).
 */
async function postFacebookPhoto({ imageUrl, caption }) {
  if (!config.meta.pageId || !config.meta.pageAccessToken) {
    throw new Error("META_PAGE_ID / META_PAGE_ACCESS_TOKEN не са зададени.");
  }
  const json = await graphPost(`${config.meta.pageId}/photos`, {
    url: imageUrl,
    caption,
    access_token: config.meta.pageAccessToken,
  });
  logger.info("[meta] Facebook photo publish OK:", json.post_id || json.id);
  return json;
}

/**
 * Публикува снимка в Instagram (Business/Creator акаунт, свързан с Facebook страницата).
 * Двустъпков процес: създава media container, после публикува.
 */
async function postInstagramPhoto({ imageUrl, caption }) {
  if (!config.meta.igUserId || !config.meta.pageAccessToken) {
    throw new Error("META_IG_USER_ID / META_PAGE_ACCESS_TOKEN не са зададени.");
  }
  const container = await graphPost(`${config.meta.igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: config.meta.pageAccessToken,
  });
  const publish = await graphPost(`${config.meta.igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: config.meta.pageAccessToken,
  });
  logger.info("[meta] Instagram photo publish OK:", publish.id);
  return publish;
}

/**
 * Публикува Reels видео в Instagram. videoUrl трябва да е публично достъпен URL.
 * Instagram обработва видеото асинхронно — изчакваме status_code === FINISHED.
 */
async function postInstagramReel({ videoUrl, caption, maxWaitMs = 60000, pollMs = 4000 }) {
  if (!config.meta.igUserId || !config.meta.pageAccessToken) {
    throw new Error("META_IG_USER_ID / META_PAGE_ACCESS_TOKEN не са зададени.");
  }
  const container = await graphPost(`${config.meta.igUserId}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    access_token: config.meta.pageAccessToken,
  });

  const start = Date.now();
  let status = "IN_PROGRESS";
  while (status === "IN_PROGRESS" && Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, pollMs));
    const check = await graphGet(container.id, {
      fields: "status_code",
      access_token: config.meta.pageAccessToken,
    });
    status = check.status_code;
    logger.info(`[meta] Instagram Reel обработка: ${status}`);
  }
  if (status !== "FINISHED") {
    throw new Error(`Instagram Reel не завърши обработка навреме (последен статус: ${status})`);
  }

  const publish = await graphPost(`${config.meta.igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: config.meta.pageAccessToken,
  });
  logger.info("[meta] Instagram Reel publish OK:", publish.id);
  return publish;
}

module.exports = { postFacebookPhoto, postInstagramPhoto, postInstagramReel };
