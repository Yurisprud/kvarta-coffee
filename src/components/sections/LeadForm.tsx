"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import {
  INTEREST_OPTIONS,
  SOURCE_OPTIONS,
  isInterestKey,
  type InterestKey,
  type SourceKey,
} from "@/lib/content";
import { validateBelarusPhone } from "@/utils/phone";
import { useUtm } from "@/hooks/useUtm";
import type { LeadFormInput, LeadApiErrorResponse } from "@/types/lead";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/utils/cn";

/**
 * Форма заявки с полной интеграцией POST /api/lead (этап 4).
 *
 * Состояния: idle → submitting → success | deduped | error.
 *  - success — заявка создана, поля очищены, показан Success-экран;
 *  - deduped — сервер вернул `deduplicated: true` (повтор в течение 10 минут),
 *    показываем вежливое уведомление вместо стандартного «Спасибо»;
 *  - error — показываем серверные `fieldErrors` под соответствующими инпутами.
 *
 * UTM-метки собирает хук `useUtm` (URL → sessionStorage) и отправляет с формой.
 * Поле «Откуда вы о нас узнали?» — обязательный radio group тегов (`source`),
 * продублирован на сервере: без выбора — 400 с fieldErrors.source.
 */

type Status = "idle" | "submitting" | "success" | "deduped" | "error";

type FieldKey = "name" | "phone" | "interest" | "source";
type FormErrors = Partial<Record<FieldKey, string>>;

/** Общие классы полей ввода — единый «рукодельный» вид. */
const fieldBase =
  "w-full rounded-card border bg-cream px-4 py-3 font-sans text-espresso placeholder:text-taupe-light/70 transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta/40";
const fieldOk = "border-hairline-strong focus:border-terracotta";
const fieldErr = "border-terracotta/60 focus:border-terracotta";

/** Верхняя граница длины для paste (санитайзер режет точнее, см. ниже). */
const PHONE_MAX_LENGTH = 19;

/**
 * Очищает сырой ввод телефона прямо при наборе и жёстко ограничивает его
 * под реальные белорусские форматы. Разрешаем только цифры, пробелы,
 * дефисы и круглые скобки, а знак «+» — исключительно в самом начале.
 * Все буквы и посторонние спецсимволы отсекаются автоматически.
 *
 * Лимиты зависят от первого символа (проверяются на каждом вводе):
 *  - `+375…` (международный): максимум 12 цифр (`+375291112233` = 13 симв.)
 *    либо до 19 символов с разделителями (`+375 (29) 111-22-33`);
 *  - `80…`   (локальный):      максимум 11 цифр (`80291112233` = 11 симв.)
 *    либо до 17 символов с разделителями (`8 (029) 111-22-33`);
 *  - иначе (национальный/`375…` без `+`): запас — 12 цифр, до 19 символов.
 *
 * Таким образом «80298585858585858» обрежется до `80298585858` (11 цифр),
 * а лишние цифры сверх формата ввести будет нельзя.
 */
function sanitizePhoneInput(raw: string): string {
  // 1. Оставляем только разрешённые символы.
  let cleaned = raw.replace(/[^\d+ ()-]/g, "");

  // 2. Знак «+» допустим только первым символом (единственный, в начале).
  const hasLeadingPlus = cleaned.startsWith("+");
  cleaned = cleaned.replace(/\+/g, "");
  if (hasLeadingPlus) cleaned = "+" + cleaned;

  // 3. Определяем лимиты по первому символу.
  const isInternational = cleaned.startsWith("+");
  const isLocalEight = !isInternational && cleaned.startsWith("8");
  const maxDigits = isLocalEight ? 11 : 12;
  const maxLength = isLocalEight ? 17 : PHONE_MAX_LENGTH;

  // 4. Оставляем не более maxDigits цифр (разделители в подсчёт не идут).
  let digitCount = 0;
  let out = "";
  for (const ch of cleaned) {
    if (/\d/.test(ch)) {
      if (digitCount >= maxDigits) continue;
      digitCount += 1;
    }
    out += ch;
  }

  // 5. Точная обрезка по общей длине (с учётом разделителей).
  return out.slice(0, maxLength);
}

export function LeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<InterestKey>("subscription");
  const [comment, setComment] = useState("");
  // Явный выбор источника (теги); null — пока не выбран, валидируется при сабмите.
  const [source, setSource] = useState<SourceKey | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  // Honeypot-поле: люди его не видят и не заполняют, а боты — да.
  const [honeypot, setHoneypot] = useState("");

  // UTM-метки для атрибуции заявки.
  const { utm } = useUtm();

  function resetForm() {
    setName("");
    setPhone("");
    setComment("");
    setInterest("subscription");
    setSource(null);
    setErrors({});
  }

  // Предвыбор интереса при переходе с CTA каталога/подписки: карточки и кнопка
  // «Оформить подписку» несут data-interest, ведут на #lead и здесь подсказывают
  // форме, какую категорию предвыбрать. Делегирование на document позволяет
  // оставить Catalog/Subscription серверными компонентами.
  useEffect(() => {
    function handleCtaClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const key = target
        .closest<HTMLAnchorElement>("a[data-interest]")?.dataset.interest;
      if (key && isInterestKey(key)) setInterest(key);
    }
    document.addEventListener("click", handleCtaClick);
    return () => document.removeEventListener("click", handleCtaClick);
  }, []);

  /** Выбор источника: обновляет состояние и снимает ошибку поля. */
  function selectSource(value: SourceKey) {
    setSource(value);
    setErrors((prev) => (prev.source ? { ...prev, source: undefined } : prev));
  }

  // Обработчик ввода телефона: чистим строку «на лету» и храним в стейте.
  // Сырую (но санитизированную) строку дальше получат и клиентская валидация,
  // и payload для бэкенда — validateBelarusPhone нормализует её сам.
  function handlePhoneChange(e: ChangeEvent<HTMLInputElement>) {
    setPhone(sanitizePhoneInput(e.target.value));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Быстрая клиентская валидация (дублирует серверную — для мгновенного UX).
    const nextErrors: FormErrors = {};
    if (name.trim().length < 2) {
      nextErrors.name = "Укажите имя (минимум 2 символа).";
    }
    const phoneCheck = validateBelarusPhone(phone);
    if (!phoneCheck.valid) {
      nextErrors.phone = phoneCheck.error ?? "Некорректный номер телефона.";
    }
    if (source === null) {
      nextErrors.source = "Выберите, откуда вы о нас узнали.";
    }

    setErrors(nextErrors);
    // `|| source === null` — страховка и для TypeScript: после этой проверки
    // `source` сужается до SourceKey для payload ниже.
    if (Object.keys(nextErrors).length > 0 || source === null) {
      setStatus("error");
      return;
    }

    setStatus("submitting");

    // Формируем payload по контракту LeadFormInput (+ UTM из хука).
    // Поле `company` — honeypot для серверной анти-бот проверки (см. route.ts).
    const payload = {
      name: name.trim(),
      phone,
      interest,
      source,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
      ...utm,
      company: honeypot,
    } satisfies LeadFormInput & { company: string };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: { ok: true; id: string; deduplicated?: boolean } =
          await res.json();
        if (data.deduplicated) {
          setStatus("deduped");
        } else {
          setStatus("success");
          resetForm();
        }
        return;
      }

      // Ошибка валидации/сервера.
      let errorBody: LeadApiErrorResponse | null = null;
      try {
        errorBody = (await res.json()) as LeadApiErrorResponse;
      } catch {
        errorBody = null;
      }

      if (res.status === 400 && errorBody?.fieldErrors) {
        const serverErrors: FormErrors = {};
        if (errorBody.fieldErrors.name) serverErrors.name = errorBody.fieldErrors.name;
        if (errorBody.fieldErrors.phone)
          serverErrors.phone = errorBody.fieldErrors.phone;
        if (errorBody.fieldErrors.source)
          serverErrors.source = errorBody.fieldErrors.source;
        if (errorBody.fieldErrors.interest)
          serverErrors.interest = errorBody.fieldErrors.interest;
        setErrors(serverErrors);
        setStatus("error");
        return;
      }

      setErrors({});
      setStatus("error");
    } catch {
      // Сетевая ошибка / сервер недоступен.
      setErrors({});
      setStatus("error");
    }
  }

  // Экран дедупликации: форма полностью скрыта, повторная отправка невозможна.
  // Намеренно БЕЗ кнопки возврата — заявка уже в работе, клиенту некуда «нажать
  // ещё раз», чтобы не плодить дубли и не тревожить менеджеров.
  if (status === "deduped") {
    return (
      <Section id="lead">
        <Container>
          <div className="mx-auto max-w-lg rounded-card border border-hairline bg-paper p-8 text-center sm:p-10">
            <div
              aria-hidden="true"
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-terracotta"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <h2 className="text-2xl">Ваша заявка уже принята!</h2>
            <p className="mt-3 text-taupe">
              Мы уже обрабатываем её и свяжемся с вами в течение 15 минут.
            </p>
          </div>
        </Container>
      </Section>
    );
  }

  // Success-экран.
  if (status === "success") {
    return (
      <Section id="lead">
        <Container>
          <div className="mx-auto max-w-lg rounded-card border border-hairline bg-paper p-8 text-center sm:p-10">
            <div
              aria-hidden="true"
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-terracotta"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-2xl">Спасибо за заявку!</h2>
            <p className="mt-3 text-taupe">
              Мы получили ваш заказ и свяжемся с вами, чтобы подтвердить
              детали — обычно отвечаем в течение дня.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-6 font-sans text-sm font-medium text-terracotta underline-offset-4 hover:underline"
            >
              Отправить ещё одну заявку
            </button>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section id="lead">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Приглашение */}
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Заявка"
              title="Оставьте заявку — подберём кофе под вас"
              lead="Напишите, что интересует, и мы подскажем сорт под ваш вкус и способ заваривания. Или сразу оформите подписку."
            />
          </div>

          {/* Форма */}
          <div className="lg:col-span-7">
            <form
              noValidate
              onSubmit={handleSubmit}
              className="rounded-card border border-hairline bg-paper p-6 sm:p-8"
            >
              {/* Honeypot: скрытое поле-«ловушка» для ботов. Реальные
                  пользователи его не видят (off-screen, aria-hidden,
                  не в таб-порядке). Если окажется заполнено — это бот. */}
              <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
                <label htmlFor="lead-company">Компания</label>
                <input
                  id="lead-company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Общая ошибка отправки (не валидация полей) */}
              {status === "error" &&
                Object.keys(errors).length === 0 && (
                  <div
                    role="alert"
                    className="mb-5 rounded-card border border-terracotta/30 bg-terracotta/[0.06] px-4 py-3 font-sans text-sm text-terracotta"
                  >
                    Не удалось отправить заявку. Проверьте соединение или
                    попробуйте ещё раз чуть позже.
                  </div>
                )}

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Имя */}
                <div className="sm:col-span-1">
                  <label
                    htmlFor="lead-name"
                    className="mb-1.5 block font-sans text-sm font-medium text-espresso"
                  >
                    Имя
                  </label>
                  <input
                    id="lead-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Анна"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "lead-name-error" : undefined}
                    className={cn(fieldBase, errors.name ? fieldErr : fieldOk)}
                  />
                  {errors.name && (
                    <p
                      id="lead-name-error"
                      className="mt-1.5 font-sans text-xs text-terracotta"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Телефон */}
                <div className="sm:col-span-1">
                  <label
                    htmlFor="lead-phone"
                    className="mb-1.5 block font-sans text-sm font-medium text-espresso"
                  >
                    Телефон
                  </label>
                  <input
                    id="lead-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={phone.startsWith("8") && !phone.startsWith("+") ? 17 : PHONE_MAX_LENGTH}
                    placeholder="+375 29 111-22-33"
                    value={phone}
                    onChange={handlePhoneChange}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={
                      errors.phone ? "lead-phone-error" : undefined
                    }
                    className={cn(fieldBase, errors.phone ? fieldErr : fieldOk)}
                  />
                  {errors.phone && (
                    <p
                      id="lead-phone-error"
                      className="mt-1.5 font-sans text-xs text-terracotta"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Интерес */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="lead-interest"
                    className="mb-1.5 block font-sans text-sm font-medium text-espresso"
                  >
                    Что интересует
                  </label>
                  <select
                    id="lead-interest"
                    name="interest"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value as InterestKey)}
                    aria-invalid={Boolean(errors.interest)}
                    aria-describedby={
                      errors.interest ? "lead-interest-error" : undefined
                    }
                    className={cn(fieldBase, errors.interest ? fieldErr : fieldOk, "appearance-none pr-10")}
                  >
                    {INTEREST_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.interest && (
                    <p
                      id="lead-interest-error"
                      className="mt-1.5 font-sans text-xs text-terracotta"
                    >
                      {errors.interest}
                    </p>
                  )}
                </div>

                {/* Комментарий */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="lead-comment"
                    className="mb-1.5 block font-sans text-sm font-medium text-espresso"
                  >
                    Комментарий{" "}
                    <span className="font-normal text-taupe-light">
                      (необязательно)
                    </span>
                  </label>
                  <textarea
                    id="lead-comment"
                    name="comment"
                    rows={4}
                    placeholder="Например: люблю фруктовый кофе на фильтр, хочу попробовать Эфиопию"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className={cn(fieldBase, fieldOk, "resize-y")}
                  />
                </div>
              </div>

              {/* Источник: крупные теги-плитки вместо <select> (mobile-first,
                  попадаем пальцем без прицеливания). ARIA-радиогруппа: клик,
                  Tab и стрелки переключают выбор; ошибка — под блоком. */}
              <div className="mt-6">
                <span
                  id="lead-source-label"
                  className="mb-2 block font-sans text-sm font-medium text-espresso"
                >
                  Откуда вы о нас узнали?
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="lead-source-label"
                  aria-invalid={Boolean(errors.source)}
                  aria-describedby={
                    errors.source ? "lead-source-error" : undefined
                  }
                  className="flex flex-wrap gap-2.5"
                >
                  {SOURCE_OPTIONS.map((opt, index) => {
                    const isSelected = source === opt.value;
                    return (
                      <button
                        key={opt.value}
                        id={`lead-source-${opt.value}`}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={
                          isSelected || (source === null && index === 0)
                            ? 0
                            : -1
                        }
                        onClick={() => selectSource(opt.value)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                            e.preventDefault();
                            const dir = e.key === "ArrowRight" ? 1 : -1;
                            const next =
                              (index + dir + SOURCE_OPTIONS.length) %
                              SOURCE_OPTIONS.length;
                            const nextOpt = SOURCE_OPTIONS[next];
                            selectSource(nextOpt.value);
                            // Roving tabindex: фокус следует за выбором.
                            document
                              .getElementById(`lead-source-${nextOpt.value}`)
                              ?.focus();
                          }
                        }}
                        className={cn(
                          "min-h-11 rounded-full border px-4 py-2.5 font-sans text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40",
                          isSelected
                            ? "border-terracotta bg-terracotta font-medium text-paper"
                            : "border-hairline bg-cream text-espresso hover:border-terracotta/60 hover:text-terracotta",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {errors.source && (
                  <p
                    id="lead-source-error"
                    className="mt-2 font-sans text-xs text-terracotta"
                  >
                    {errors.source}
                  </p>
                )}
              </div>

              {/* Действие */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-6 py-3 font-sans text-sm font-medium text-paper transition-colors hover:bg-terracotta-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? (
                    <>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 animate-spin"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeOpacity="0.3"
                          strokeWidth={3}
                        />
                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                        />
                      </svg>
                      Отправляем…
                    </>
                  ) : (
                    "Отправить заявку"
                  )}
                </button>
                <p className="font-sans text-xs text-taupe-light">
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных
                  данных.
                </p>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </Section>
  );
}
