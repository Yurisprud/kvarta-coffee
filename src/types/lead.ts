/**
 * Типы данных для лидов (заявок) лендинга мастерской обжарки кофе «Кварта».
 *
 * Этот файл — единый источник правды для контракта данных между:
 * формой на лендинге (клиент) → API-эндпоинтом → слоем сохранения в БД.
 */

/**
 * Категория интереса посетителя.
 * Значения синхронизированы с <select> в форме заявки.
 */
export type LeadInterest =
  | "beans" // обжарка в зёрнах / подписка
  | "drip" // кофе в дрипах
  | "hoReCa" // корпоративный заказ (кафе, офисы)
  | "tasting" // дегустация / курс по обжарке
  | "other"; // другое

/**
 * UTM-метки для атрибуции источника трафика.
 * Все поля опциональны — в Organic-переходах они отсутствуют.
 */
export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

/**
 * Входные данные формы заявки (payload, который отправляет клиент).
 * Валидация выполняется на сервере в API-эндпоинте (этап 2).
 */
export interface LeadFormInput extends UtmParams {
  /** Имя посетителя (2–64 символа). */
  name: string;
  /** Телефон в формате E.164 или с разделителями, напр. "+375 29 111-22-33". */
  phone: string;
  /** Категория интереса из {@link LeadInterest}. */
  interest: LeadInterest;
  /** Свободный комментарий посетителя (опционально, до 1000 символов). */
  comment?: string;
}

/**
 * Запись лида, которая сохраняется в базу данных.
 * Формируется на сервере из {@link LeadFormInput} плюс служебные поля.
 */
export interface LeadRecord extends LeadFormInput {
  /** Уникальный идентификатор записи. */
  id: string;
  /** Дата и время создания заявки (ISO 8601). */
  createdAt: string;
  /** IP-адрес посетителя, определённый на сервере (может быть undefined за прокси). */
  ip?: string;
}

/**
 * Ответ API после успешного сохранения лида.
 */
export interface LeadApiSuccessResponse {
  ok: true;
  /** Идентификатор созданной (или уже существующей при дедупликации) записи. */
  id: string;
  /**
   * `true`, если заявка распознана как дубль (тот же номер в течение 10 минут)
   * и новая запись в базу НЕ добавлялась. Фронтенд может по этому флагу
   * показать, например, мягкое уведомление вместо стандартного «Спасибо».
   */
  deduplicated?: boolean;
}

/**
 * Ответ API при ошибке валидации/сохранения.
 */
export interface LeadApiErrorResponse {
  ok: false;
  /** Человекочитаемое сообщение об ошибке. */
  message: string;
  /** Пояснения по конкретным полям формы (для подсветки в UI). */
  fieldErrors?: Partial<Record<keyof LeadFormInput, string>>;
}

export type LeadApiResponse = LeadApiSuccessResponse | LeadApiErrorResponse;
