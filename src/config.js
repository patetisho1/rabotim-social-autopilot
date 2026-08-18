require("dotenv").config();

function required(name, { soft = false } = {}) {
  const v = process.env[name];
  if (!v && !soft) {
    console.warn(`[config] Липсва env променлива: ${name} (ще пропусне съответната стъпка/платформа)`);
  }
  return v || "";
}

module.exports = {
  anthropic: {
    apiKey: required("ANTHROPIC_API_KEY", { soft: true }),
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
  },
  meta: {
    pageId: required("META_PAGE_ID", { soft: true }),
    pageAccessToken: required("META_PAGE_ACCESS_TOKEN", { soft: true }),
    igUserId: required("META_IG_USER_ID", { soft: true }),
  },
  tiktok: {
    accessToken: required("TIKTOK_ACCESS_TOKEN", { soft: true }),
  },
  rabotim: {
    statsEndpoint: required("RABOTIM_STATS_ENDPOINT", { soft: true }),
    statsApiKey: required("RABOTIM_STATS_API_KEY", { soft: true }),
  },
  publicAssets: {
    repo: process.env.PUBLIC_ASSETS_REPO || "",
    branch: process.env.PUBLIC_ASSETS_BRANCH || "social-assets",
  },
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL || "",
  brand: {
    name: "Rabotim.com",
    site: "https://www.rabotim.com",
    accent: "#1F5C4A",
    accentLight: "#E9F2EE",
    dark: "#123028",
    font: "sans-serif",
  },
};
