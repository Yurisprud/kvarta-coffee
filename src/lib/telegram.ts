/**
 * Дублирование заявок в Telegram-бот (бонусная задача ТЗ).
 *
 * Чистый серверный код на встроенном `fetch` — без telegraf и других
 * сторонних SDK: модуль знает только один вызов Bot API (`sendMessage`).
 *
 * Реальный эндпоинт Bot API:
 * `https://api.telegram.org/bot<TOKEN>/sendMessage`
 * (поддомен `api.telegram.org` и префикс `bot` перед токеном обязательны).
 *
 * Контракт надёжности: функция НИКОГДА не бросает исключение — лид к этому
 * моменту уже сохранён, поэтому сбой Telegram (сеть, 4xx/5xx, отсутствие
 * ключей) логируется и трактуется как best-effort, не влияя на ответ клиенту.
 */

import { INTEREST_OPTIONS, SOURCE_OPTIONS } from "@/lib/content";
import type { LeadRecord } from "@/types/lead";

const TELEGRAM_API_BASE = "https://api.telegram.org";

/** Таймаут вызова Bot API: не держим ответ клиента подольше 3 секунд. */
const TELEGRAM_TIMEOUT_MS = 3000;

/** Подпись значения из опции контента; fallback — сам ключ (не теряем данные). */
function labelOf(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((opt) => opt.value === value)?.label ?? value;
}

/**
 * Экранирует HTML-спецсимволы.
 *
 * Имя и комментарий приходят от пользователя и подставляются в текст с
 * `parse_mode: "HTML"`. Без экранирования Telegram отвечает 400
 * «can't parse entities» на любом `<` в тексте, а пользователь к тому же
 * сможет внедрить собственную HTML-разметку в уведомление менеджеру.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Отправляет уведомление о новой заявке в чат Telegram-бота.
 *
 * @param lead Запись лида, уже сохранённая в локальное хранилище
 *             (см. {@link LeadRecord}). UTM-метки опциональны.
 */
export async function sendLeadToTelegram(lead: LeadRecord): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  // Локальная разработка без ключей: предупреждаем, но не падаем.
  if (!token || !chatId) {
    console.warn(
      "[POST /api/lead] Telegram: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы — уведомление о заявке пропущено.",
    );
    return;
  }

  const text = [
    "☕️ <b>Новая заявка — Обжарка «Кварта»</b>",
    `👤 <b>Имя:</b> ${escapeHtml(lead.name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(lead.phone)}`,
    `🎯 <b>Что интересует:</b> ${escapeHtml(labelOf(INTEREST_OPTIONS, lead.interest))}`,
    `📢 <b>Источник:</b> ${escapeHtml(labelOf(SOURCE_OPTIONS, lead.source))}`,
    `💬 <b>Комментарий:</b> ${lead.comment ? escapeHtml(lead.comment) : "нет"}`,
    `🔗 <b>UTM Source:</b> ${lead.utm_source ? escapeHtml(lead.utm_source) : "прямой переход"}`,
  ].join("\n");

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Защита от зависшего Bot API: клиент ждёт ответ максимум таймаут.
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    // Telegram отвечает 200 + {ok:false} при некоторых ошибках — проверяем и тело.
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[POST /api/lead] Telegram API вернул ${res.status}: ${detail}`,
      );
    }
  } catch (error) {
    console.error(
      "[POST /api/lead] Не удалось отправить уведомление в Telegram:",
      error,
    );
  }
}