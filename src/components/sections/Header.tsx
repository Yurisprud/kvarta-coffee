"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { cn } from "@/utils/cn";

/**
 * Хедер лендинга: текстовый логотип «Кварта», меню-якоря и плашка
 * с графиком работы. Липкий, полупрозрачный, с тонкой нижней границей.
 * Мобильное меню реализовано через раскрывающийся список.
 */
export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-cream/85 backdrop-blur-md">
      {/* Плашка-график: самое важное обещание мастерской. */}
      <div className="bg-espresso text-cream">
        <Container className="flex h-9 items-center justify-center">
          <p className="text-center font-sans text-[0.7rem] font-medium uppercase tracking-[0.18em] sm:text-xs">
            <span className="hidden sm:inline">Обжариваем по четвергам</span>
            <span className="sm:hidden">Обжарка — чт, развоз — пт</span>
            <span aria-hidden="true" className="px-2 opacity-50">
              ·
            </span>
            <span className="hidden sm:inline">развозим по пятницам</span>
          </p>
        </Container>
      </div>

      <Container className="flex h-16 items-center justify-between">
        {/* Текстовый логотип */}
        <Link
          href="/"
          className="group flex items-baseline gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="font-display text-2xl font-semibold tracking-tight text-espresso">
            Кварта
          </span>
          <span className="hidden font-sans text-[0.65rem] uppercase tracking-[0.25em] text-taupe-light sm:inline">
            обжарка
          </span>
        </Link>

        {/* Десктопная навигация */}
        <nav aria-label="Основная навигация" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-sans text-sm text-espresso/80 underline-offset-4 transition-colors hover:text-terracotta hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Мобильная кнопка меню */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-espresso transition-colors hover:bg-espresso/5 md:hidden"
        >
          <span className="sr-only">Меню</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      </Container>

      {/* Мобильное раскрывающееся меню */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-hairline bg-cream md:hidden"
      >
        <Container>
          <nav aria-label="Мобильная навигация">
            <ul className="flex flex-col py-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href} className="border-b border-hairline/60 last:border-0">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block py-3 font-sans text-base text-espresso",
                      "transition-colors hover:text-terracotta",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>
    </header>
  );
}
