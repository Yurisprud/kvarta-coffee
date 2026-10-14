import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type Tone = "cream" | "paper" | "espresso";
type Border = "top" | "bottom" | "none";
type Spacing = "default" | "hero" | "none";

/** Фон и цвет текста секции. */
const toneClasses: Record<Tone, string> = {
  cream: "bg-cream",
  paper: "bg-paper",
  espresso: "bg-espresso text-cream",
};

/** Разделительная линия сверху/снизу (hairline) — аккуратный редакторский макет. */
const borderClasses: Record<Border, string> = {
  top: "border-t border-hairline",
  bottom: "border-b border-hairline",
  none: "",
};

/** Вертикальные отступы секции. */
const spacingClasses: Record<Spacing, string> = {
  default: "py-16 sm:py-20 lg:py-24",
  hero: "py-14 sm:py-20 lg:py-24",
  none: "",
};

/**
 * Единая обёртка секции лендинга: фон (tone), разделительная линия (border),
 * вертикальные отступы (spacing) и опциональный `id` для якорной навигации.
 * Используется всеми смысловыми блоками страницы для консистентности.
 *
 * Семантические `<header>` и `<footer>` этой обёрткой намеренно не заменяются.
 */
export function Section({
  id,
  children,
  className,
  tone = "cream",
  border = "top",
  spacing = "default",
  overflow = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: Tone;
  border?: Border;
  spacing?: Spacing;
  /** Обрезать выступающий контент (напр. декоративные элементы hero). */
  overflow?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        // компенсация липкого хедера при переходе по якорю
        "scroll-mt-24",
        toneClasses[tone],
        borderClasses[border],
        spacingClasses[spacing],
        overflow && "overflow-hidden",
        className,
      )}
    >
      {children}
    </section>
  );
}

