const { execFile } = require("child_process");
const path = require("path");
const config = require("../config");
const logger = require("../logger");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Meta и TikTok четат медия по публичен URL, не приемат directly файлов ъплоуд от
 * произволен сървър. Най-евтиният вариант, който пасва на съществуващия git workflow,
 * е: commit-ваме генерирания файл в public/social-assets/ на repo-то и после четем
 * суровото съдържание през raw.githubusercontent.com.
 *
 * Това предполага, че workflow-ът (.github/workflows/daily-post.yml) вече е направил
 * `actions/checkout` на PUBLIC_ASSETS_REPO с права за push, и че branch-ът съществува.
 * Ако предпочиташ S3/Cloudflare R2 вместо git — замени само тази функция, останалият
 * пайплайн не знае и не го интересува откъде идва публичният URL.
 */
async function publishAsset(localFilePath) {
  if (!config.publicAssets.repo) {
    throw new Error(
      "PUBLIC_ASSETS_REPO не е зададен — не мога да генерирам публичен URL за медията. " +
        "Виж .env.example за настройка, или смени hosting стратегията в src/hosting/publicAssetHost.js."
    );
  }

  const fileName = path.basename(localFilePath);
  const repoRelativePath = `public/social-assets/${fileName}`;

  // Очаква се workflow-ът вече да е в root на checked-out repo-то (cwd).
  await run("cp", [localFilePath, repoRelativePath]).catch(async () => {
    // ако директорията не съществува
    await run("mkdir", ["-p", "public/social-assets"]);
    await run("cp", [localFilePath, repoRelativePath]);
  });

  await run("git", ["add", repoRelativePath]);
  await run("git", ["commit", "-m", `social asset: ${fileName}`]);
  await run("git", ["push", "origin", `HEAD:${config.publicAssets.branch}`]);

  const url = `https://raw.githubusercontent.com/${config.publicAssets.repo}/${config.publicAssets.branch}/${repoRelativePath}`;
  logger.info(`[publicAssetHost] Публикувано: ${url}`);
  return url;
}

module.exports = { publishAsset };
