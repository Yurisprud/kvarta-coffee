import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-sans text-sm font-medium tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  // Основное действие — спокойная терракотовая плоскость (без градиента/неона).
  primary:
    "bg-terracotta text-paper hover:bg-terracotta-dark px-6 py-3 shadow-none",
  // Второстепенное — тонкий контур по цвету эспрессо.
  secondary:
    "border border-espresso/25 text-espresso hover:border-espresso/50 hover:bg-espresso/[0.04] px-6 py-3",
  // Текстовая ссылка-«стрелка».
  ghost:
    "text-terracotta hover:text-terracotta-dark underline-offset-4 hover:underline px-0 py-1",
};

interface CommonProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

/** Кнопка-ссылка (рендерит <Link> Next.js). */
export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  ...rest
}: CommonProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "href" | "className" | "children"
  >) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** Настоящая кнопка <button> (для формы на следующем шаге). */
export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}
