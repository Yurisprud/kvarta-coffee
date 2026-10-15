/**
 * POST /api/lead — приём заявок с лендинга Обжарка «Кварта».
 *
 * Ответственность эндпоинта:
 *  1. принять и провалидировать JSON;
 *  2. отсеять ботов через honeypot-поле `company` (см. ниже);
 *  3. проверить белорусский телефон ({@link validateBelarusPhone});
 *  4. провалидировать интерес и явный выбор источника (`source`);
 *  5. собрать UTM-метки (из тела и/или query-строки);
 *  6. определить IP клиента (с учётом прокси Vercel/Netlify);
 *  7. сохранить с дедупликацией ({@link saveLead});
 *  8. продублировать заявку в Telegram-бот ({@link sendLeadToTelegram}, best-effort);
 *  9. вернуть типизированный ответ ({@link LeadApiResponse}).
 *
 * Примечание (Next.js 16): при включённом `cacheComponents` segment-конфиги
 * `runtime`/`dynamic` в route-хендлерах запрещены. Рантайм `nodejs` — дефолт,
 * а POST-запросы не кэшируются, поэтому отдельная конфигурация не требуется.
 */

import { NextResponse, type NextRequest } from "next/server";
import { validateBelarusPhone } from "@/utils/phone";
import { saveLead } from "@/lib/db";
import { isInterestKey, isSourceKey } from "@/lib/content";
import { sendLeadToTelegram } from "@/lib/telegram";
import type {
  LeadApiResponse,
  LeadFormInput,
  UtmParams,
} from "@/types/lead";

/** Ключи UTM-меток, которые мы вытаскиваем из запроса. */
const UTM_KEYS: readonly (keyof UtmParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

const NAME_MAX = 64;
const COMMENT_MAX = 1000;

/** Определяет IP клиента с учётом reverse-proxy (Vercel/Netlify/Cloudflare). */
function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Заголовок может содержать цепочку "client, proxy1, proxy2" — берём первый.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? undefined;
}

/** Собирает UTM-метки из query-параметров и тела запроса (тело имеет приоритет). */
function collectUtm(
  searchParams: URLSearchParams,
  body: Record<string, unknown>,
): UtmParams {
  const utm: UtmParams = {};
  for (const key of UTM_KEYS) {
    const fromBody = body[key];
    const value =
      typeof fromBody === "string" && fromBody.trim() !== ""
        ? fromBody.trim()
        : (searchParams.get(key) ?? undefined);
    if (value) utm[key] = value;
  }
  return utm;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<LeadApiResponse>> {
  // --- 1. Парсинг тела ---
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Ожидается корректный JSON в теле запроса." },
      { status: 400 },
    );
  }

  if (typeof rawBody !== "object" || rawBody === null) {
    return NextResponse.json(
      { ok: false, message: "Некорректная структура запроса." },
      { status: 400 },
    );
  }

  const body = rawBody as Record<string, unknown>;

  // --- Honeypot: ловушка для ботов ---
  // Скрытое поле `company` не должно быть заполнено живым пользователем.
  // Если оно непустое — это бот: возвращаем «успех», но НЕ сохраняем заявку,
  // чтобы бот не понял, что пойман, и не пытался обойти проверку.
  const honeypot =
    typeof body.company === "string" ? body.company.trim() : "";
  if (honeypot !== "") {
    return NextResponse.json({
      ok: true,
      id: "blocked",
      deduplicated: false,
    });
  }

  const fieldErrors: Partial<Record<keyof LeadFormInput, string>> = {};

  // --- 2. Валидация имени ---
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2) {
    fieldErrors.name = "Укажите имя (минимум 2 символа).";
  } else if (name.length > NAME_MAX) {
    fieldErrors.name = `Имя слишком длинное (максимум ${NAME_MAX} символов).`;
  }

  // --- 3. Валидация телефона ---
  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  const phoneCheck = validateBelarusPhone(rawPhone);
  if (!phoneCheck.valid) {
    fieldErrors.phone = phoneCheck.error ?? "Некорректный номер телефона.";
  }

  // --- 4. Валидация категории интереса (type guard из контента) ---
  // `isInterestKey` сужает строку из тела запроса до InterestKey — единый
  // источник правды по ключам лежит в INTEREST_OPTIONS (src/lib/content.ts).
  const rawInterest = typeof body.interest === "string" ? body.interest : "";
  const interest = isInterestKey(rawInterest) ? rawInterest : null;
  if (interest === null) {
    fieldErrors.interest = "Выберите категорию интереса.";
  }

  // --- 5. Валидация явного выбора источника (теги «Откуда вы о нас узнали?») ---
  // Обязательное поле: маркетингу нужна атрибуция и без UTM (organic,
  // рекомендации, офлайн). Пустое/неизвестное значение → 400, как у остальных.
  const rawSource = typeof body.source === "string" ? body.source : "";
  const source = isSourceKey(rawSource) ? rawSource : null;
  if (source === null) {
    fieldErrors.source = "Выберите, откуда вы о нас узнали.";
  }

  // --- 6. Валидация комментария ---
  let comment: string | undefined;
  if (body.comment !== undefined && body.comment !== null) {
    if (typeof body.comment !== "string") {
      fieldErrors.comment = "Комментарий должен быть строкой.";
    } else if (body.comment.length > COMMENT_MAX) {
      fieldErrors.comment = `Комментарий слишком длинный (максимум ${COMMENT_MAX} символов).`;
    } else {
      const trimmed = body.comment.trim();
      comment = trimmed === "" ? undefined : trimmed;
    }
  }

  // Ранний return со сужением типов: после него TS знает, что `interest` и
  // `source` — валидные ключи (не null), поэтому в saveLead ниже не нужны
  // небезопасные приведения `as LeadInterest` / `as LeadSource`.
  if (
    Object.keys(fieldErrors).length > 0 ||
    interest === null ||
    source === null
  ) {
    return NextResponse.json(
      { ok: false, message: "Проверьте заполнение формы.", fieldErrors },
      { status: 400 },
    );
  }

  // --- 7. Сбор аналитики: UTM + IP ---
  const utm = collectUtm(request.nextUrl.searchParams, body);
  const ip = getClientIp(request);

  // --- 8. Сохранение с дедупликацией ---
  try {
    const { record, deduplicated } = await saveLead({
      name,
      phone: phoneCheck.normalized as string,
      // Сужены type guard-ами выше — типы совпадают с LeadRecord структурно
      // (InterestKey ≡ LeadInterest, SourceKey ≡ LeadSource).
      interest,
      source,
      comment,
      ip,
      ...utm,
    });

    // --- 9. Дублирование в Telegram (best-effort, НЕ блокирует ответ) ---
    // Лид уже в базе, поэтому сбой Telegram не должен менять ответ клиенту —
    // `sendLeadToTelegram` сам ловит все ошибки внутри. При дедупликации
    // уведомление не шлём: новая заявка не создавалась, менеджеры уже видели
    // исходную (иначе повтор в течение 10 минут спамил бы чат).
    if (!deduplicated) {
      await sendLeadToTelegram(record);
    }

    return NextResponse.json({ ok: true, id: record.id, deduplicated });
  } catch (error) {
    console.error("[POST /api/lead] saveLead failed:", error);
    return NextResponse.json(
      { ok: false, message: "Не удалось сохранить заявку. Попробуйте позже." },
      { status: 500 },
    );
  }
}
