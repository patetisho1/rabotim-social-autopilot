const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const { generateImage } = require("./generateImage");
const logger = require("../logger");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Генерира кратко вертикално видео (1080x1920, ~8 сек) от branded изображение с лек
 * "Ken Burns" zoom — достатъчно за TikTok/Reels, докато няма истински видео клипове
 * (UGC от изпълнители е по-добрият дългосрочен източник, виж README).
 *
 * Изисква системен ffmpeg (наличен по подразбиране в GitHub Actions ubuntu runners).
 */
async function generateVideo({ headline, tag, outPath, seconds = 8, fps = 30 }) {
  const tmpImage = path.join(path.dirname(outPath), `_frame_${Date.now()}.png`);
  await generateImage({ headline, tag, outPath: tmpImage, width: 1080, height: 1920 });

  const totalFrames = seconds * fps;
  // zoompan: бавен zoom-in от 1.0 до ~1.15 за "жив" ефект без реален видео материал.
  const zoompanFilter = `zoompan=z='min(zoom+0.0007,1.15)':d=${totalFrames}:s=1080x1920:fps=${fps}`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  try {
    await run("ffmpeg", [
      "-y",
      "-loop",
      "1",
      "-i",
      tmpImage,
      "-vf",
      `${zoompanFilter},format=yuv420p`,
      "-t",
      String(seconds),
      "-r",
      String(fps),
      "-c:v",
      "libx264",
      "-movflags",
      "+faststart",
      outPath,
    ]);
  } catch (e) {
    logger.error("[generateVideo] ffmpeg грешка:", e.stderr || e.message);
    throw e;
  } finally {
    fs.rmSync(tmpImage, { force: true });
  }

  return outPath;
}

module.exports = { generateVideo };
