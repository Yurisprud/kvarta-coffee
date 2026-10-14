import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * Заголовок секции: надзаголовок (мелкая капитель с акцентной чертой),
 * основной заголовок и опциональный вводный абзац.
 * Выравнивание по левому краю — «издательский», а не центрованный шаблон.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  const alignCls = align === "center" ? "text-center items-center mx-auto" : "";
  const titleColor = tone === "light" ? "text-cream" : "text-espresso";
  const leadColor = tone === "light" ? "text-cream/70" : "text-taupe";
  const eyebrowColor = tone === "light" ? "text-cream/60" : "text-terracotta";

  return (
    <div className={cn("max-w-2xl", alignCls, className)}>
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 flex items-center gap-3 font-sans text-xs font-semibold uppercase tracking-[0.2em]",
            eyebrowColor,
            align === "center" && "justify-center",
          )}
        >
          {align === "left" && (
            <span
              aria-hidden="true"
              className="inline-block h-px w-8 bg-current opacity-50"
            />
          )}
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-balance text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]",
          titleColor,
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", leadColor)}>
          {lead}
        </p>
      ) : null}
    </div>
  );
}
