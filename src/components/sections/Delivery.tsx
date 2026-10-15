import { CONTACT } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Условия доставки и контакты. Подача — как аккуратная «визитная
 * карточка»: две колонки (самовывоз / доставка), тонкие разделители,
 * без лишнего декора. Ключевой порог бесплатной доставки подсвечен.
 */
export function Delivery() {
  return (
    <Section id="delivery" tone="paper">
      <Container>
        <SectionHeading
          eyebrow="Как получить"
          title="Самовывоз и доставка по Минску (от 50 BYN бесплатно)"
          lead={`${CONTACT.roastDay}, ${CONTACT.deliveryDay.toLowerCase()}. Забирайте сами или закажите доставку на дом.`}
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-hairline bg-hairline md:grid-cols-2">
          {/* Самовывоз */}
          <div className="bg-cream p-6 sm:p-8">
            <h3 className="font-display text-xl">Самовывоз</h3>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="font-sans text-xs uppercase tracking-[0.15em] text-taupe-light">
                  Адрес
                </dt>
                <dd className="mt-1 font-display text-lg text-espresso">
                  {CONTACT.city}, {CONTACT.pickupAddress}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-xs uppercase tracking-[0.15em] text-taupe-light">
                  Когда
                </dt>
                <dd className="mt-1 text-espresso/85">{CONTACT.hours}</dd>
              </div>
            </dl>
            <p className="mt-5 font-sans text-sm text-taupe">
              {CONTACT.pickupNote} — напишите нам заранее, и мы отложим ваш заказ.
            </p>
          </div>

          {/* Доставка */}
          <div className="bg-cream p-6 sm:p-8">
            <h3 className="font-display text-xl">Доставка</h3>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="font-sans text-xs uppercase tracking-[0.15em] text-taupe-light">
                  День развоза
                </dt>
                <dd className="mt-1 text-espresso/85">{CONTACT.deliveryDay}</dd>
              </div>
              <div>
                <dt className="font-sans text-xs uppercase tracking-[0.15em] text-taupe-light">
                  Стоимость
                </dt>
                <dd className="mt-1 text-espresso/85">
                  <span className="font-display text-lg text-terracotta">
                    Бесплатно
                  </span>{" "}
                  при заказе от {CONTACT.freeDeliveryFrom} BYN
                </dd>
              </div>
            </dl>
            <p className="mt-5 font-sans text-sm text-taupe">
              Доставляем по Минску в пятницу. Точное время и адрес согласуем
              лично — напишите удобный интервал в заявке.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
