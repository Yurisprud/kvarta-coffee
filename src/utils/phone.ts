/**
 * Валидация и нормализация телефонных номеров Беларуси.
 *
 * Поддерживаемые форматы ввода → нормализованный вид `375XXXXXXXXX`:
 *  - "+375 (29) 111-22-33"
 *  - "375291112233"
 *  - "8 029 111 22 33"        (тройной "80" → "375")
 *  - "291112233"              (национальный формат без кода страны)
 */

/** Код страны Беларусь. */
const COUNTRY_CODE = "375";

/** Допустимые коды мобильных операторов РБ. */
const ALLOWED_OPERATOR_CODES = ["29", "44", "33", "25"] as const;

/** Длина национального номера: код оператора (2) + номер абонента (7). */
const NATIONAL_NUMBER_LENGTH = 9;

export interface PhoneValidationResult {
  /** Валиден ли номер. */
  valid: boolean;
  /**
   * Нормализованный номер в формате E.164 без ведущего "+",
   * например "375291112233". Заполнен только при `valid === true`.
   */
  normalized?: string;
  /** Сообщение об ошибке на русском для показа во фронтенде. Только при `valid === false`. */
  error?: string;
}

/**
 * Приводит сырой ввод к цифровому виду с кодом страны `375`.
 * Возвращает строку из 12 цифр (`375` + 9 цифр) либо `null`,
 * если номер невозможно привести к национальному формату.
 */
export function normalizePhone(raw: string): string | null {
  if (typeof raw !== "string") return null;

  // Оставляем только цифры — отбрасываем "+", пробелы, скобки, дефисы и т.п.
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Национальный формат без кода страны: "291112233" → "375291112233"
  if (digits.length === NATIONAL_NUMBER_LENGTH) {
    return COUNTRY_CODE + digits;
  }

  // Формат с транковым префиксом "80...": "80291112233" → "375291112233"
  if (digits.length === 11 && digits.startsWith("80")) {
    return COUNTRY_CODE + digits.slice(2);
  }

  // Иначе ожидаем, что номер уже содержит код страны (12 цифр).
  return digits;
}

/**
 * Форматирует нормализованный номер в человекочитаемый вид "+375 29 111-22-33".
 * Если номер невалиден — возвращает исходную строку без изменений.
 */
export function formatBelarusPhone(raw: string): string {
  const normalized = normalizePhone(raw);
  if (
    !normalized ||
    normalized.length !== 12 ||
    !normalized.startsWith(COUNTRY_CODE)
  ) {
    return raw;
  }
  const national = normalized.slice(COUNTRY_CODE.length); // 9 цифр
  return `+${COUNTRY_CODE} ${national.slice(0, 2)} ${national.slice(
    2,
    5,
  )}-${national.slice(5, 7)}-${national.slice(7)}`;
}

/**
 * Полная валидация белорусского мобильного номера.
 * Проверяет: наличие цифр, код страны, код оператора и длину.
 */
export function validateBelarusPhone(raw: string): PhoneValidationResult {
  const normalized = normalizePhone(raw);

  if (!normalized) {
    return { valid: false, error: "Укажите номер телефона." };
  }

  if (normalized.length !== 12 || !normalized.startsWith(COUNTRY_CODE)) {
    return {
      valid: false,
      error: "Неверный формат номера. Пример: +375 29 111-22-33.",
    };
  }

  const national = normalized.slice(COUNTRY_CODE.length); // 9 цифр
  if (national.length !== NATIONAL_NUMBER_LENGTH) {
    return {
      valid: false,
      error: "Неверное количество цифр в номере телефона.",
    };
  }

  const operatorCode = national.slice(0, 2);
  if (!(ALLOWED_OPERATOR_CODES as readonly string[]).includes(operatorCode)) {
    return {
      valid: false,
      error: `Код оператора «${operatorCode}» не поддерживается. Допустимы коды: 25, 29, 33, 44.`,
    };
  }

  return { valid: true, normalized };
}
