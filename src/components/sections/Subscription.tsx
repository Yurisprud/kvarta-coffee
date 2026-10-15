import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

const PERKS = [
  "Две пачки по 250 г каждый месяц",
  "Разные сорта — каждый раз новый вкус",
  "Бесплатная доставка по Минску",
  "Пропустить или отменить — в любой момент",
];

/**
 * Блок «Кофейная подписка» — выделенное предложение на глубоком
 * эспрессо-фоне. Единственная «тёмная» секция лендинга: создаёт акцент
 * и визуальную паузу, но остаётся в тёплой, матовой палитре.
 */
export function Subscription() {
  return (
    <Section id="subscription" tone="espresso">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Текстовая часть */}
          <div>
            <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-cream/60">
              Кофейная подписка
            </p>
            <h2 className="text-balance text-3xl leading-tight text-cream sm:text-4xl lg:text-[2.75rem]">
              Свежий кофе каждый месяц — без напоминаний
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-cream/70">
              Две пачки по 250 г раз в месяц с бесплатной доставкой. Кофе
              приезжает к вам через день-два после обжарки — всегда на пике.
            </p>

            {/* Цена */}
            <div className="mt-8 flex items-baseline gap-2">
              <span className="font-display text-5xl text-cream">54</span>
              <span className="font-sans text-lg text-cream/70">BYN / месяц</span>
            </div>

            {/* Преимущества */}
            <ul className="mt-8 grid gap-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta"
                  />
                  <span className="font-sans text-cream/85">{perk}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <ButtonLink
                href="#lead"
                variant="primary"
                data-interest="subscription"
                className="bg-cream text-espresso hover:bg-cream/90"
              >
                Оформить подписку
                <span aria-hidden="true">→</span>
              </ButtonLink>
            </div>
          </div>

          {/* Фото */}
          <div className="relative aspect-4/3 overflow-hidden rounded-card ring-1 ring-cream/15 lg:aspect-4/5">
            <Image
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
              alt="Свежеобжаренный кофе и чашка на столе мастерской"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
