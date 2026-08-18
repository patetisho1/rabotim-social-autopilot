const config = require("../config");
const logger = require("../logger");

const BASE = "https://open.tiktokapis.com/v2";

/**
 * ВАЖНО, прочети преди да разчиташ на това:
 *
 * TikTok Content Posting API изисква твоето App да мине TikTok-ов "app review" за
 * scope-а video.publish, за да може да пуска ПУБЛИЧНИ постове директно към чужд/бизнес
 * акаунт. Docато app-ът е в "unaudited" статус, видеата качени през API обикновено
 * влизат като частен draft в inbox-а на TikTok акаунта (изисква ръчно потвърждение в
 * приложението) — това е ограничение от TikTok, не бъг тук.
 *
 * Освен това PULL_FROM_URL (както е по-долу) изисква верифициран домейн в TikTok
 * Developer Portal за твоя app.
 *
 * Проверявай текущите изисквания тук преди да пуснеш в продукция —
 * условията на TikTok API се променят често:
 * https://developers.tiktok.com/doc/content-posting-api-get-started
 */
async function postTikTokVideo({ videoUrl, caption, privacyLevel = "SELF_ONLY" }) {
  if (!config.tiktok.accessToken) {
    throw new Error("TIKTOK_ACCESS_TOKEN не е зададен.");
  }

  const initRes = await fetch(`${BASE}/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.tiktok.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: caption,
        privacy_level: privacyLevel, // "SELF_ONLY" е безопасният избор докато app-ът не е одобрен
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });

  const json = await initRes.json();
  if (!initRes.ok || json.error?.code !== "ok") {
    throw new Error(`TikTok API грешка: ${JSON.stringify(json)}`);
  }

  logger.info("[tiktok] Видео публикувано (publish_id):", json.data?.publish_id);
  if (privacyLevel === "SELF_ONLY") {
    logger.warn(
      "[tiktok] Постнато като частен draft (SELF_ONLY) — трябва ръчно потвърждение в TikTok приложението, докато app-ът мине review за публично публикуване."
    );
  }
  return json.data;
}

module.exports = { postTikTokVideo };
