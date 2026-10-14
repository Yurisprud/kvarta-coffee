"use client";

import { useState } from "react";
import type { UtmParams } from "@/types/lead";

/**
 * Ключ для хранения UTM-меток в sessionStorage.
 * UTM живёт в пределах вкладки: если посетитель пришёл по рекламе,
 * а форму заполнил позже — метки не потеряются.
 */
const STORAGE_KEY = "kvarta.utm.v1";

const UTM_KEYS: (keyof UtmParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

/** Извлекает UTM-метки из строки запроса URL. */
function readUtmFromLocation(): UtmParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }

  return utm;
}

/** Безопасно читает ранее сохранённые UTM из sessionStorage. */
function readStoredUtm(): UtmParams {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as UtmParams;
  } catch {
    return {};
  }
}

/**
 * Вычисляет актуальные UTM-метки и синхронизирует их с sessionStorage.
 *
 * Логика:
 *  - если в URL есть UTM — сохраняем их (перезаписывая старые) и отдаём;
 *  - если в URL UTM нет, но есть сохранённые ранее — отдаём сохранённые;
 *  - иначе — пустой объект (organic-переход).
 *
 * Вынесено в чистую функцию, чтобы вызывать лениво при инициализации
 * состояния (без эффекта и каскадных ре-рендеров).
 */
function resolveInitialUtm(): UtmParams {
  const fromUrl = readUtmFromLocation();
  const hasUrlUtm = Object.keys(fromUrl).length > 0;

  if (hasUrlUtm) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      // sessionStorage может быть недоступен (приватный режим) — не критично.
    }
    return fromUrl;
  }

  return readStoredUtm();
}

/**
 * useUtm — собирает UTM-метки из адресной строки и надёжно сохраняет их
 * в sessionStorage, чтобы передавать вместе с формой.
 *
 * Инициализация выполняется лениво при первом рендере на клиенте, поэтому
 * значение согласовано с SSR и не требует дополнительного эффекта.
 */
export function useUtm(): { utm: UtmParams } {
  // На сервере отдаём пустой объект; на клиенте — вычисляем UTM один раз.
  const [utm] = useState<UtmParams>(() =>
    typeof window === "undefined" ? {} : resolveInitialUtm(),
  );

  return { utm };
}

