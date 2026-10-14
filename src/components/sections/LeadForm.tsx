"use client";

import { useState, type FormEvent } from "react";
import { INTEREST_OPTIONS, type InterestKey } from "@/lib/content";
import { validateBelarusPhone } from "@/utils/phone";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/utils/cn";

/**
 * Форма заявки — только UI и состояния (этап 3).
 * Интеграция с POST /api/lead будет добавлена на следующем шаге, поэтому
 * submit сейчас имитирует отправку и переводит форму в состояние успеха.
 *
 * Состояния: idle → submitting → success | error.
 * Валидация телефона переиспользует серверный `validateBelarusPhone`.
 */

type Status = "idle" | "submitting" | "success" | "error";

interface FormErrors {
  name?: string;
  phone?: string;
}

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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Клиентская валидация (дублирует серверную — для UX).
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

    // Имитация отправки (реальный fetch добавим на следующем шаге).
    setStatus("submitting");
    window.setTimeout(() => {
      setStatus("success");
    }, 700);
  }

  // Состояние успеха — показываем вместо формы.
  if (status === "success") {
    return (
      <section id="lead" className="scroll-mt-24 border-t border-hairline py-16 sm:py-20 lg:py-24">
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
            <h2 className="text-2xl">Спасибо, {name.trim()}!</h2>
            <p className="mt-3 text-taupe">
              Заявка принята. Мы свяжемся с вами и подтвердим заказ — обычно
              отвечаем в течение дня.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setName("");
                setPhone("");
                setComment("");
                setErrors({});
              }}
              className="mt-6 font-sans text-sm font-medium text-terracotta underline-offset-4 hover:underline"
            >
              Отправить ещё одну заявку
            </button>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id="lead" className="scroll-mt-24 border-t border-hairline py-16 sm:py-20 lg:py-24">
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
                  {status === "submitting" ? "Отправляем…" : "Отправить заявку"}
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
    </section>
  );
}
