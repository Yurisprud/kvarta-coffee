"use client";

import { useState } from "react";
import { FRESHNESS_STEPS } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/utils/cn";

/**
 * Блок «Почему свежесть важна» — интерактивный таймлайн жизни кофе.
 * Реализован как доступный tablist: этапы переключаются кликом/с клавиатуры.
 * Акцент на том, что кофе попадает к клиенту на 1–3 день после обжарки —
 * на пике вкуса, а не как магазинный (к моменту покупки уже «поздний»).
 */
export function FreshnessTimeline() {
  const [activeId, setActiveId] = useState(FRESHNESS_STEPS[2].id);
  const active =
    FRESHNESS_STEPS.find((s) => s.id === activeId) ?? FRESHNESS_STEPS[2];

  return (
    <Section id="philosophy" tone="paper">
      <Container>
        <SectionHeading
          eyebrow="Философия"
          title="Кофе — продукт со сроком жизни"
          lead="У магазинного кофе к моменту покупки часто уже позади недели на складе. Мы работаем иначе: небольшие партии по 5 кг и короткий путь до вашей чашки."
        />

        {/* Таб-лист этапов */}
        <div className="mt-12">
          <div
            role="tablist"
            aria-label="Этапы жизни кофе после обжарки"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          >
            {FRESHNESS_STEPS.map((step, index) => {
              const isActive = step.id === active.id;
              const isPeak = step.id === "peak";
              return (
                <button
                  key={step.id}
                  role="tab"
                  id={`tab-${step.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${step.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveId(step.id)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      const dir = e.key === "ArrowRight" ? 1 : -1;
                      const next =
                        (index + dir + FRESHNESS_STEPS.length) %
                        FRESHNESS_STEPS.length;
                      setActiveId(FRESHNESS_STEPS[next].id);
                    }
                  }}
                  className={cn(
                    "group relative flex flex-col items-start gap-1 rounded-card border p-4 text-left transition-colors",
                    isActive
                      ? "border-terracotta bg-terracotta/[0.06]"
                      : "border-hairline bg-cream hover:border-hairline-strong",
                  )}
                >
                  <span
                    className={cn(
                      "font-sans text-[0.7rem] font-semibold uppercase tracking-[0.15em]",
                      isActive ? "text-terracotta" : "text-taupe-light",
                    )}
                  >
                    {step.day}
                  </span>
                  <span
                    className={cn(
                      "font-display text-lg",
                      isActive ? "text-espresso" : "text-espresso/70",
                    )}
                  >
                    {step.title}
                    {isPeak && (
                      <span className="ml-2 align-middle font-sans text-[0.6rem] font-semibold uppercase tracking-wider text-terracotta">
                        мы здесь
                      </span>
                    )}
                  </span>
                  {/* Тонкий индикатор-подложка */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-4 -bottom-px h-0.5 rounded-full transition-opacity",
                      isActive ? "bg-terracotta opacity-100" : "opacity-0",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Панель активного этапа */}
          <div
            role="tabpanel"
            id={`panel-${active.id}`}
            aria-labelledby={`tab-${active.id}`}
            className="mt-6 rounded-card border border-hairline bg-cream p-6 sm:p-8"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
                {active.day}
              </span>
              <h3 className="font-display text-2xl">{active.title}</h3>
            </div>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-taupe sm:text-lg">
              {active.description}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
