import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

/**
 * Hero: главный честный заголовок про свежесть кофе, личная история
 * основателей и главное целевое действие. Асимметричная сетка —
 * слева текст, справа атмосферное фото обжарки.
 */
export function Hero() {
  return (
    <Section border="bottom" spacing="hero" overflow>
      <Container className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Текстовая колонка */}
        <div className="lg:col-span-7">
          {/* Надзаголовок-обещание */}
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-terracotta/25 bg-terracotta/[0.06] px-3 py-1 font-sans text-xs font-medium tracking-wide text-terracotta">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-terracotta"
            />
            Кофе на 1–3 день после обжарки
          </p>

          <h1 className="text-balance text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Свежеобжаренный кофе в Минске —{" "}
            <span className="text-terracotta">от обжарщиков</span> прямиком в вашу
            чашку
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-taupe">
            Мы — Аня и Дмитрий, бывшие бариста. Обжариваем кофе малыми партиями
            по 5 кг у себя в мастерской и привозим его к вам на пике вкуса —
            через день-два после ростера, а не через месяц со склада.
          </p>

          {/* Ключевые факты — «рукодельно», списком */}
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {[
              "Партии по 5 кг",
              "Обжарка по четвергам",
              "Доставка по Минску",
            ].map((fact) => (
              <li
                key={fact}
                className="flex items-center gap-2 font-sans text-sm text-espresso/80"
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1 w-1 rounded-full bg-terracotta"
                />
                {fact}
              </li>
            ))}
          </ul>

          {/* Главное целевое действие */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="#coffee" variant="primary">
              Смотреть кофе
              <span aria-hidden="true">→</span>
            </ButtonLink>
            <ButtonLink href="#subscription" variant="secondary">
              Оформить подписку
            </ButtonLink>
          </div>
        </div>

        {/* Фото-колонка */}
        <div className="lg:col-span-5">
          <figure className="relative">
            <div className="relative aspect-4/5 overflow-hidden rounded-card bg-paper ring-1 ring-hairline">
              <Image
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=80"
                alt="Обжарка кофе: свежие зёрна в барабане ростера в мастерской"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                priority
              />
            </div>
            {/* Рукоподобная подпись к фото */}
            <figcaption className="mt-3 font-sans text-xs text-taupe-light">
              Наша обжарка. Четверг, 6 утра — и поехали.
            </figcaption>
          </figure>
        </div>
      </Container>
    </Section>
  );
}
