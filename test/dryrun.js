// Тества генерирането на съдържание + снимка + видео БЕЗ да пуска нищо реално
// (без публично hosting, без Meta/TikTok извиквания). Полезно за проверка, че
// пайплайнът работи, преди да сложиш реални API ключове.
//
// Пусни с: npm run dry-run

const path = require("path");
const fs = require("fs");
const { buildTodaysContent } = require("../src/contentMixer");
const { generateImage } = require("../src/media/generateImage");
const { generateVideo } = require("../src/media/generateVideo");

const OUT_DIR = path.join(__dirname, "..", "sample-output");

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { theme, caption, headline } = await buildTodaysContent();

  console.log("\n=== ТЕМА НА ДЕНЯ ===");
  console.log(theme.label, `(${theme.key})`);
  console.log("\n=== CAPTION ===");
  console.log(caption);

  const imagePath = path.join(OUT_DIR, "dryrun-post.png");
  await generateImage({ headline, tag: theme.label, outPath: imagePath, width: 1080, height: 1080 });
  console.log("\n=== СНИМКА ===");
  console.log("Записана:", imagePath);

  if (theme.videoWorthy) {
    const videoPath = path.join(OUT_DIR, "dryrun-post.mp4");
    await generateVideo({ headline, tag: theme.label, outPath: videoPath, seconds: 5 });
    console.log("\n=== ВИДЕО ===");
    console.log("Записано:", videoPath);
  } else {
    console.log("\n(Днешната тема не е videoWorthy — видео не се генерира в dry-run-а.)");
  }

  console.log("\nDry-run завърши успешно — пайплайнът работи локално.");
}

main().catch((e) => {
  console.error("Dry-run грешка:", e);
  process.exitCode = 1;
});
