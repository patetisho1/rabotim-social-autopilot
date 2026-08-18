const path = require("path");
const { buildTodaysContent } = require("./contentMixer");
const { generateImage } = require("./media/generateImage");
const { generateVideo } = require("./media/generateVideo");
const { publishAsset } = require("./hosting/publicAssetHost");
const meta = require("./platforms/meta");
const tiktok = require("./platforms/tiktok");
const logger = require("./logger");

const OUT_DIR = path.join(__dirname, "..", "output");

async function main() {
  const results = { facebook: null, instagram: null, tiktok: null };
  const errors = [];

  const { theme, caption, headline } = await buildTodaysContent();
  logger.info("[index] Готов caption:\n" + caption);

  // --- Снимка (за FB + IG feed постове) ---
  const imagePath = path.join(OUT_DIR, `post-${Date.now()}.png`);
  await generateImage({ headline, tag: theme.label, outPath: imagePath, width: 1080, height: 1080 });

  let imageUrl;
  try {
    imageUrl = await publishAsset(imagePath);
  } catch (e) {
    errors.push(`Публикуване на снимка неуспешно: ${e.message}`);
    await logger.alert(`Хостване на снимка се провали: ${e.message}`);
    return finish(results, errors);
  }

  // --- Facebook ---
  try {
    results.facebook = await meta.postFacebookPhoto({ imageUrl, caption });
  } catch (e) {
    errors.push(`Facebook: ${e.message}`);
    await logger.alert(`Facebook постване се провали: ${e.message}`);
  }

  // --- Instagram (feed снимка) ---
  try {
    results.instagram = await meta.postInstagramPhoto({ imageUrl, caption });
  } catch (e) {
    errors.push(`Instagram: ${e.message}`);
    await logger.alert(`Instagram постване се провали: ${e.message}`);
  }

  // --- TikTok (само за теми, маркирани videoWorthy) ---
  if (theme.videoWorthy) {
    const videoPath = path.join(OUT_DIR, `post-${Date.now()}.mp4`);
    try {
      await generateVideo({ headline, tag: theme.label, outPath: videoPath });
      const videoUrl = await publishAsset(videoPath);
      results.tiktok = await tiktok.postTikTokVideo({ videoUrl, caption });
    } catch (e) {
      errors.push(`TikTok: ${e.message}`);
      await logger.alert(`TikTok постване се провали: ${e.message}`);
    }
  } else {
    logger.info(`[index] Тема "${theme.key}" не е маркирана за видео — TikTok се пропуска днес.`);
  }

  finish(results, errors);
}

function finish(results, errors) {
  logger.info("[index] Резултат:", JSON.stringify(results, null, 2));
  if (errors.length) {
    logger.error(`[index] Завърши с ${errors.length} грешка/и:`, errors);
    process.exitCode = 1;
  } else {
    logger.info("[index] Всичко публикувано успешно.");
  }
}

main().catch(async (e) => {
  logger.error("[index] Неочаквана грешка:", e);
  await logger.alert(`Дневният пост-пайплайн падна неочаквано: ${e.message}`);
  process.exitCode = 1;
});
