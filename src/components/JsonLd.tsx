import { CONTACT } from "@/lib/content";

/**
 * Структурированные данные Schema.org для локального бизнеса «Кварта».
 *
 * Тип `LocalBusiness` расширен подтипом `CafeOrCoffeeShop` (Schema.org
 * допускает массив типов) — это помогает поисковикам точнее классифицировать
 * мастерскую обжарки. Добавлены: адрес (PostalAddress), телефон, часы работы
 * самовывоза (openingHoursSpecification), ценовой диапазон, гео-координаты
 * и информация об обжарке по четвергам.
 *
 * Контакт (телефон) вынесен сюда как константу-заглушку — замените на
 * реальный номер перед публикацией.
 */
const PHONE = "+375 00 000-00-00"; // TODO: заменить на реальный телефон мастерской
const SITE_URL = "https://kvarta.coffee";

export function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "CafeOrCoffeeShop"],
    name: "Кварта",
    description:
      "Небольшая мастерская свежей обжарки кофе в Минске. Обжариваем малыми партиями по 5 кг, привозим кофе на 1–3 день после обжарки. Кофейная подписка и доставка по пятницам.",
    url: SITE_URL,
    telephone: PHONE,
    image: `${SITE_URL}/opengraph-image`,
    priceRange: "18–54 BYN",
    servesCuisine: "Coffee",
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.pickupAddress,
      addressLocality: CONTACT.city,
      addressCountry: "BY",
    },
    geo: {
      "@type": "GeoCoordinates",
      // Примерные координаты ул. Короля, 9, Минск. Уточните при необходимости.
      latitude: 53.9023,
      longitude: 27.5619,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday", "Saturday"],
        opens: "11:00",
        closes: "18:00",
      },
    ],
    // Уточнение по графику работы мастерской.
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Обжарка",
        value: CONTACT.roastDay,
      },
      {
        "@type": "PropertyValue",
        name: "Доставка",
        value: CONTACT.deliveryDay,
      },
    ],
    makesOffer: [
      {
        "@type": "Offer",
        name: "Кофе в зёрнах",
        priceCurrency: "BYN",
        lowPrice: "26",
        highPrice: "32",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          value: 250,
          unitText: "g",
        },
      },
      {
        "@type": "Offer",
        name: "Кофейная подписка",
        priceCurrency: "BYN",
        price: "54",
        description: "2 пачки по 250 г раз в месяц, бесплатная доставка.",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // XSS-защита по документации Next: экранируем '<' в JSON-LD.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
