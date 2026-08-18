const config = require("./config");

function ts() {
  return new Date().toISOString();
}

const logger = {
  info: (...args) => console.log(`[${ts()}] INFO`, ...args),
  warn: (...args) => console.warn(`[${ts()}] WARN`, ...args),
  error: (...args) => console.error(`[${ts()}] ERROR`, ...args),

  // Праща кратко известие при провал (Slack/Telegram/Discord webhook — форматът е
  // достатъчно универсален за Slack incoming webhook; за Telegram виж коментара долу).
  async alert(message) {
    logger.error("ALERT:", message);
    if (!config.alertWebhookUrl) return;
    try {
      await fetch(config.alertWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Slack incoming webhook очаква { text: "..." }.
        // За Telegram bot API форматът е различен (chat_id, text) — смени тук, ако ползваш Telegram.
        body: JSON.stringify({ text: `🚨 Rabotim social autopilot: ${message}` }),
      });
    } catch (e) {
      logger.error("Неуспешно изпращане на alert webhook:", e.message);
    }
  },
};

module.exports = logger;
