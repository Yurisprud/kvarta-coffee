/**
 * Контент лендинга Обжарка «Кварта».
 *
 * Единая точка правды для текстов, каталога и контактов. Вынесено из
 * компонентов, чтобы секции оставались презентационными, а контент легко
 * редактировался без погружения в разметку.
 */

/** Категория интереса для формы — синхронизирована с типом LeadInterest. */
export type InterestKey = "subscription" | "order" | "question";

export interface NavItem {
  href: string;
  label: string;
}

/** Пункты меню-якорей в хедере. */
export const NAV_ITEMS: NavItem[] = [
  { href: "#coffee", label: "Кофе" },
  { href: "#philosophy", label: "О свежести" },
  { href: "#subscription", label: "Подписка" },
  { href: "#delivery", label: "Доставка" },
  { href: "#lead", label: "Заявка" },
];

/** Позиция каталога. */
export interface Product {
  id: string;
  name: string;
  /** Страна/регион происхождения. */
  origin: string;
  /** Вкусовой профиль — короткие дескрипторы. */
  notes: string[];
  /** Тип обжарки. */
  roast: string;
  /** Фасовка, напр. «250 г». */
  weight: string;
  /** Цена в белорусских рублях. */
  price: number;
  /** Подпись к фото (alt). */
  alt: string;
  /** URL фото с Unsplash (теплые кофейные тона). */
  image: string;
  /** Ключ категории для предвыбора интереса в форме (CTA каталога). */
  interest: InterestKey;
}

/** Каталог ассортимента. */
export const PRODUCTS: Product[] = [
  {
    id: "ethiopia",
    name: "Эфиопия Иргачеффе",
    origin: "Эфиопия",
    notes: ["Цветочный", "Бергамот"],
    roast: "Светлая обжарка",
    weight: "250 г",
    price: 32,
    alt: "Светлообжаренное кофе в зёрнах Эфиопия Иргачеффе",
    image:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80",
    interest: "order",
  },
  {
    id: "colombia",
    name: "Колумбия Уила",
    origin: "Колумбия",
    notes: ["Карамель", "Красное яблоко"],
    roast: "Средняя обжарка",
    weight: "250 г",
    price: 29,
    alt: "Зёрна кофе Колумбия Уила средней обжарки",
    image:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80",
    interest: "order",
  },
  {
    id: "brazil",
    name: "Бразилия Серрадо",
    origin: "Бразилия",
    notes: ["Орех", "Шоколад"],
    roast: "Под эспрессо",
    weight: "250 г",
    price: 26,
    alt: "Кофе Бразилия Серрадо для эспрессо",
    image:
      "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=900&q=80",
    interest: "order",
  },
  {
    id: "drip-pack",
    name: "Дрип-пакеты, ассорти",
    origin: "Сборник",
    notes: ["Удобно в дорогу", "10 штук"],
    roast: "Разная обжарка",
    weight: "10 шт",
    price: 18,
    alt: "Дрип-пакеты для заваривания кофе в дорогу",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
    interest: "order",
  },
];

/** Варианты категории интереса для <select> в форме (строго по ТЗ). */
export const INTEREST_OPTIONS: { value: InterestKey; label: string }[] = [
  { value: "subscription", label: "Подписка" },
  { value: "order", label: "Разовый заказ" },
  { value: "question", label: "Вопрос" },
];

/** Типовая проверка: входит ли строка в допустимые ключи интереса. */
export function isInterestKey(value: string): value is InterestKey {
  return INTEREST_OPTIONS.some((opt) => opt.value === value);
}

/**
 * Ключ источника перехода, выбранный посетителем явно (теги в форме).
 * Значения синхронизированы с LeadSource в src/types/lead.ts.
 */
export type SourceKey = "instagram" | "yandex" | "google" | "friends" | "other";

/** Варианты ответа «Откуда вы о нас узнали?» — крупные теги-плитки в форме. */
export const SOURCE_OPTIONS: { value: SourceKey; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "yandex", label: "Яндекс" },
  { value: "google", label: "Google" },
  { value: "friends", label: "Рекомендация друзей" },
  { value: "other", label: "Другое" },
];

/** Типовая проверка: входит ли строка в допустимые ключи источника. */
export function isSourceKey(value: string): value is SourceKey {
  return SOURCE_OPTIONS.some((opt) => opt.value === value);
}

/**
 * Этапы таймлайна «Почему свежесть важна».
 *
 * Отражают реальный процесс мастерской: обжарка по четвергам (День 1),
 * дегазация и доставка по пятницам (День 2), приём клиентом на 1–3 день
 * и пик вкуса в первые недели. Диапазоны дней не пересекаются.
 */
export interface FreshnessStep {
  id: string;
  /** День после обжарки. */
  day: string;
  title: string;
  description: string;
}

export const FRESHNESS_STEPS: FreshnessStep[] = [
  {
    id: "roast",
    day: "День 1",
    title: "Обжарка",
    description:
      "Обжариваем зерно маленькими партиями по 5 кг строго по четвергам.",
  },
  {
    id: "rest",
    day: "День 2",
    title: "Отдых и доставка",
    description:
      "Кофе дегазируется в мастерской, а в пятницу мы доставляем его свежим по всему Минску.",
  },
  {
    id: "peak",
    day: "День 3–14",
    title: "Пик вкуса",
    description:
      "Зерно попадает к вам на 1–3 день после обжарки. Это идеальное время для заваривания.",
  },
  {
    id: "stale",
    day: "День 21+",
    title: "Увядание",
    description:
      "Оксидация берет свое. Кофе по-прежнему хорош, но тонкие цветочные и фруктовые ноты начинают блекнуть.",
  },
];

/** Контактная и сервисная информация. */
export const CONTACT = {
  city: "Минск",
  pickupAddress: "ул. Короля, 9",
  pickupNote: "Самовывоз по предварительной договорённости",
  hours: "пн–пт 8:00–20:00, сб–вс 10:00–18:00",
  roastDay: "Обжариваем по четвергам",
  deliveryDay: "Доставляем по пятницам",
  freeDeliveryFrom: 50,
} as const;
