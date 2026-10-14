import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * Центральный контейнер лендинга.
 * Ограничивает контентную ширину и задаёт согласованные боковые отступы
 * (Mobile First: компактно на телефоне, воздушнее на десктопе).
 */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}
