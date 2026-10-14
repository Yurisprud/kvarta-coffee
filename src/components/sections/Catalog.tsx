import Image from "next/image";
import { PRODUCTS } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Каталог ассортимента. Подача — как аккуратный прайс-лист кофейни:
 * тонкие границы, открытая сетка, без тяжёлых теней и «глянца».
 * Фото в фиксированном соотношении (нет CLS), цена — справа от названия.
 */
export function Catalog() {
  return (
    <Section id="coffee">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Ассортимент"
            title="Что обжарим на этой неделе"
            lead="Четыре позиции, которые точно будут в ростере в четверг. Состав обновляем — следите за сезонностью."
          />
          <p className="shrink-0 font-sans text-sm text-taupe-light">
            Цены указаны за пачку
          </p>
        </div>

        {/* Сетка каталога */}
        <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-hairline bg-hairline sm:grid-cols-2">
          {PRODUCTS.map((product) => (
            <li key={product.id} className="bg-cream">
              <article className="group flex h-full flex-col">
                {/* Фото */}
                <div className="relative aspect-16/11 overflow-hidden bg-paper">
                  <Image
                    src={product.image}
                    alt={product.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>

                {/* Контент карточки */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-xl leading-snug">
                      {product.name}
                    </h3>
                    <p className="shrink-0 font-display text-xl tabular-nums text-terracotta">
                      {product.price}&nbsp;BYN
                    </p>
                  </div>

                  <p className="mt-1 font-sans text-xs uppercase tracking-[0.15em] text-taupe-light">
                    {product.roast} · {product.weight}
                  </p>

                  {/* Вкусовой профиль — «чипсы» без глянца */}
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {product.notes.map((note) => (
                      <li
                        key={note}
                        className="rounded-full border border-hairline-strong bg-paper px-2.5 py-0.5 font-sans text-xs text-espresso/75"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-5">
                    <a
                      href="#lead"
                      className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-terracotta underline-offset-4 hover:underline"
                    >
                      Заказать
                      <span
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </a>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
