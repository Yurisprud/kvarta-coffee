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
 *  8. вернуть типизированный ответ ({@link LeadApiResponse}).
 *
 * Примечание (Next.js 16): при включённом `cacheComponents` segment-конфиги
 * `runtime`/`dynamic` в route-хендлерах запрещены. Рантайм `nodejs` — дефолт,
 * а POST-запросы не кэшируются, поэтому отдельная конфигурация не требуется.
 */

import { NextResponse, type NextRequest } from "next/server";
import { validateBelarusPhone } from "@/utils/phone";
import { saveLead } from "@/lib/db";
import type {
  LeadApiResponse,
  LeadFormInput,
  LeadInterest,
  LeadSource,
  UtmParams,
} from "@/types/lead";

/** Допустимые значения категории интереса. */
const ALLOWED_INTERESTS: readonly LeadInterest[] = [
  "beans",
  "drip",
  "hoReCa",
  "tasting",
  "other",
];

/** Допустимые значения явного выбора источника (теги в форме). */
const ALLOWED_SOURCES: readonly LeadSource[] = [
  "instagram",
  "yandex",
  "google",
  "friends",
  "other",
];

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

  // --- 4. Валидация категории интереса ---
  const interest = typeof body.interest === "string" ? body.interest : "";
  if (!ALLOWED_INTERESTS.includes(interest as LeadInterest)) {
    fieldErrors.interest = "Выберите категорию интереса.";
  }

  // --- 5. Валидация явного выбора источника (теги «Откуда вы о нас узнали?») ---
  // Обязательное поле: маркетингу нужна атрибуция и без UTM (organic,
  // рекомендации, офлайн). Пустое/неизвестное значение → 400, как у остальных.
  const source = typeof body.source === "string" ? body.source : "";
  if (!ALLOWED_SOURCES.includes(source as LeadSource)) {
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

  if (Object.keys(fieldErrors).length > 0) {
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
      interest: interest as LeadInterest,
      source: source as LeadSource,
      comment,
      ip,
      ...utm,
    });

    return NextResponse.json({ ok: true, id: record.id, deduplicated });
  } catch (error) {
    console.error("[POST /api/lead] saveLead failed:", error);
    return NextResponse.json(
      { ok: false, message: "Не удалось сохранить заявку. Попробуйте позже." },
      { status: 500 },
    );
  }
}
