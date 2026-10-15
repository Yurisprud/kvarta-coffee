import Link from "next/link";
import { CONTACT, NAV_ITEMS } from "@/lib/content";
import { Container } from "@/components/ui/Container";

/**
 * Год в копирайте задан константой, а не через `new Date()`.
 * При включённом `cacheComponents` (Next 16) `new Date()` во время
 * пререндера считается нестабильным значением и ломает статический билд.
 * Обновляйте эту константу по мере необходимости.
 */
const COPYRIGHT_YEAR = 2026;

/**
 * Подвал лендинга: лаконичный, в тон хедеру. Логотип, короткий слоган,
 * ключевые контакты и навигация. Никаких тяжёлых колонток — только суть.
 */
export function Footer() {
  return (
    <footer className="border-t border-hairline bg-paper">
      <Container className="py-12 sm:py-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Бренд */}
          <div>
            <p className="font-display text-2xl font-semibold text-espresso">
              Обжарка «Кварта»
            </p>
            <p className="mt-2 max-w-xs font-sans text-sm text-taupe">
              Небольшая мастерская обжарки кофе в Минске. {CONTACT.roastDay},{" "}
              {CONTACT.deliveryDay.toLowerCase()}.
            </p>
          </div>

          {/* Навигация */}
          <nav aria-label="Навигация в подвале">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-taupe-light">
              Разделы
            </p>
            <ul className="mt-3 space-y-2">
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

          {/* Контакты */}
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-taupe-light">
              Где нас найти
            </p>
            <address className="mt-3 space-y-1 font-sans text-sm not-italic text-espresso/80">
              <p>
                {CONTACT.city}, {CONTACT.pickupAddress}
              </p>
              <p className="text-taupe">{CONTACT.hours}</p>
            </address>
          </div>
        </div>

        {/* Нижняя строка */}
        <div className="mt-10 flex flex-col gap-2 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs text-taupe-light">
            © {COPYRIGHT_YEAR} Обжарка «Кварта». Обжариваем с любовью в Минске.
          </p>
          <p className="font-sans text-xs text-taupe-light">
            {CONTACT.roastDay} · {CONTACT.deliveryDay}
          </p>
        </div>
      </Container>
    </footer>
  );
}
