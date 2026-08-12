// Sends a plain-text notification to the designer's Telegram via a bot.
// Configured through env vars (see .env.example):
//   TELEGRAM_BOT_TOKEN — token from @BotFather
//   TELEGRAM_CHAT_ID   — the designer's personal chat id (or a group's)
//
// If either is missing, notifications are silently skipped — the site
// still works fully without Telegram configured, orders just won't ping
// anyone. A failed Telegram call never breaks order creation: we log the
// error and move on, since losing a notification is much better than
// losing the order itself.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

export const isTelegramConfigured = Boolean(BOT_TOKEN && CHAT_ID);

export async function sendTelegramMessage(text) {
  if (!isTelegramConfigured) {
    console.log("Telegram: skipped (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set).");
    return;
  }

  console.log("Telegram: sending order notification…");

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      // Without a timeout, a firewall/antivirus that silently drops the
      // connection (instead of rejecting it) would make this hang forever
      // with no error ever printed. 10s is generous for a single API call.
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Telegram notification failed:", res.status, body);
      return;
    }

    console.log("Telegram: notification sent successfully.");
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      console.error(
        "Telegram notification timed out after 10s — something between this " +
          "server and api.telegram.org is blocking or silently dropping the " +
          "connection (common cause: antivirus/firewall blocking node.exe, " +
          "or a corporate/VPN network). Try a different network, or allow " +
          "node.exe through your firewall/antivirus."
      );
    } else {
      console.error("Telegram notification error:", err.message);
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatOrderNotification(order) {
  const lines = [];

  if (order.type === "custom") {
    lines.push("🧵 <b>Нове індивідуальне замовлення</b>");
  } else {
    lines.push("🛍 <b>Нове замовлення</b>");
  }

  lines.push("");

  if (order.items?.length) {
    if (order.type === "custom") {
      const item = order.items[0];
      lines.push(`<b>Опис:</b> ${escapeHtml(item.title)}`);
      if (item.price > 0) {
        lines.push(`<b>Бюджет:</b> ${item.price.toLocaleString("uk-UA")} грн`);
      }
    } else {
      lines.push("<b>Товари:</b>");
      let total = 0;
      for (const item of order.items) {
        lines.push(`• ${escapeHtml(item.title)} — ${item.price.toLocaleString("uk-UA")} грн`);
        total += item.price;
      }
      lines.push(`<b>Разом:</b> ${total.toLocaleString("uk-UA")} грн`);
    }
    lines.push("");
  }

  lines.push(`<b>Ім'я:</b> ${escapeHtml(order.name)}`);
  if (order.phone) lines.push(`<b>Телефон:</b> ${escapeHtml(order.phone)}`);
  lines.push(`<b>Контакт:</b> ${escapeHtml(order.contact)}`);
  if (order.city) lines.push(`<b>Доставка:</b> ${escapeHtml(order.city)}`);
  if (order.notes) lines.push(`<b>Коментар:</b> ${escapeHtml(order.notes)}`);

  return lines.join("\n");
}
