import type { Metadata } from "next";
import { Lora, Golos_Text } from "next/font/google";
import "./globals.css";

/* Display-шрифт для заголовков — тёплая антиква с поддержкой кириллицы. */
const lora = Lora({
  subsets: ["cyrillic", "latin"],
  variable: "--font-lora",
  display: "swap",
});

/* Основной шрифт текста и UI — чистый, дружелюбный, с кириллицей. */
const golos = Golos_Text({
  subsets: ["cyrillic", "latin"],
  variable: "--font-golos",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kvarta.coffee"),
  title: {
    default: "Обжарка «Кварта» — мастерская свежей обжарки кофе в Минске",
    template: "%s · Обжарка «Кварта»",
  },
  description:
    "Обжарка «Кварта» — небольшая мастерская свежей обжарки кофе в Минске. Обжариваем малыми партиями по 5 кг, привозим кофе на 1–3 день после обжарки. Кофейная подписка и доставка по пятницам. Самовывоз: ул. Короля, 9.",
  applicationName: "Обжарка «Кварта»",
  keywords: [
    "обжарка кофе Минск",
    "свежий кофе Минск",
    "кофейная мастерская",
    "кофейная подписка",
    "specialty кофе Беларусь",
    "купить кофе в зёрнах Минск",
    "обжарка по четвергам",
  ],
  authors: [{ name: "Обжарка «Кварта»" }],
  creator: "Обжарка «Кварта»",
  publisher: "Обжарка «Кварта»",
  // Подсказки поисковикам: индексировать и следовать по ссылкам.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Обжарка «Кварта» — мастерская свежей обжарки кофе в Минске",
    description:
      "Кофе, который попадает к вам на 1–3 день после обжарки. Малые партии по 5 кг от бывших бариста Ани и Дмитрия. Подписка и доставка по Минску.",
    url: "/",
    siteName: "Обжарка «Кварта»",
    locale: "ru_BY",
    type: "website",
    images: [
      {
        // Плейсхолдер превью. Для прода замените на собственный /og-image (1200×630).
        url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "Обжарка «Кварта» — свежая обжарка кофе в Минске",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Обжарка «Кварта» — мастерская свежей обжарки кофе в Минске",
    description:
      "Свежий кофе на 1–3 день после обжарки. Малые партии по 5 кг, подписка и доставка по Минску.",
    images: [
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&h=630&q=80",
    ],
  },
  category: "food",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${lora.variable} ${golos.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

