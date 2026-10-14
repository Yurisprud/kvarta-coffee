import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * Обёртка секции лендинга: единые вертикальные отступы и опциональный
 * id для якорной навигации. Верхняя hairline-линия отделяет секции,
 * придавая ощущение аккуратного редакторского макета.
 */
export function Section({
  id,
  children,
  className,
  bordered = true,
  tone = "cream",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  bordered?: boolean;
  tone?: "cream" | "paper" | "espresso";
}) {
  const tones = {
    cream: "bg-cream",
    paper: "bg-paper",
    espresso: "bg-espresso text-cream",
  } as const;

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 py-16 sm:py-20 lg:py-24",
        tones[tone],
        bordered && "border-t border-hairline",
        className,
      )}
    >
      {children}
    </section>
  );
}
