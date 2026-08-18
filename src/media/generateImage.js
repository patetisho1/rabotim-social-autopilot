const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const config = require("../config");

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Просто word-wrap по приблизителен брой символи на ред (достатъчно за branded карти,
// не е нужна прецизна метрика на шрифта).
function wrapText(text, maxCharsPerLine) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxCharsPerLine && current) {
      lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Генерира branded квадратно изображение (1080x1080, за FB/IG feed) с headline текст.
 * Връща пътя до записания PNG файл.
 */
async function generateImage({ headline, tag, outPath, width = 1080, height = 1080 }) {
  const { accent, dark, brand } = { accent: config.brand.accent, dark: config.brand.dark, brand: config.brand.name };

  const lines = wrapText(headline, 16).slice(0, 3);
  const lineHeight = 78;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

  const textSvg = lines
    .map(
      (line, i) =>
        `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" font-size="64" font-weight="700" fill="#FFFFFF" font-family="Arial, sans-serif">${escapeXml(line)}</text>`
    )
    .join("\n");

  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="100%" stop-color="${dark}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" />

    ${
      tag
        ? `<rect x="60" y="60" width="${Math.min(60 + tag.length * 20, width - 120)}" height="56" rx="28" fill="#FFFFFF22" />
           <text x="90" y="97" font-size="28" fill="#FFFFFF" font-family="Arial, sans-serif">${escapeXml(tag)}</text>`
        : ""
    }

    ${textSvg}

    <text x="50%" y="${height - 70}" text-anchor="middle" font-size="34" font-weight="700" fill="#FFFFFF" font-family="Arial, sans-serif">${escapeXml(brand)}</text>
  </svg>`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  return outPath;
}

module.exports = { generateImage };
