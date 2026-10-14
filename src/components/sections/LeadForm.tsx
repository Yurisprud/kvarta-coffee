"use client";

import { useState, type FormEvent } from "react";
import { INTEREST_OPTIONS, type InterestKey } from "@/lib/content";
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
 */

type Status = "idle" | "submitting" | "success" | "deduped" | "error";

type FieldKey = "name" | "phone";
type FormErrors = Partial<Record<FieldKey, string>>;

/** Общие классы полей ввода — единый «рукодельный» вид. */
const fieldBase =
  "w-full rounded-card border bg-cream px-4 py-3 font-sans text-espresso placeholder:text-taupe-light/70 transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta/40";
const fieldOk = "border-hairline-strong focus:border-terracotta";
const fieldErr = "border-terracotta/60 focus:border-terracotta";

export function LeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<InterestKey>("beans");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  // UTM-метки для атрибуции заявки.
  const { utm } = useUtm();

  function resetForm() {
    setName("");
    setPhone("");
    setComment("");
    setInterest("beans");
    setErrors({});
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

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      return;
    }

    setStatus("submitting");

    // Формируем payload по контракту LeadFormInput (+ UTM из хука).
    const payload: LeadFormInput = {
      name: name.trim(),
      phone,
      interest,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
      ...utm,
    };

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

  // Экран дедупликации: заявка уже принята, обрабатывается.
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
              Мы обрабатываем её прямо сейчас и скоро свяжемся с вами.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-6 font-sans text-sm font-medium text-terracotta underline-offset-4 hover:underline"
            >
              Вернуться к форме
            </button>
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
                    placeholder="+375 29 111-22-33"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    className={cn(fieldBase, fieldOk, "appearance-none pr-10")}
                  >
                    {INTEREST_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
