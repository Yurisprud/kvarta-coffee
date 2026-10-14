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
    default: "Кварта — свежая обжарка кофе в Минске",
    template: "%s · Кварта",
  },
  description:
    "Небольшая мастерская обжарки кофе в Минске. Обжариваем малыми партиями по 5 кг, привозим кофе на 1–3 день после обжарки. Кофейная подписка и доставка по пятницам.",
  keywords: [
    "обжарка кофе Минск",
    "свежий кофе",
    "кофейная подписка",
    " specialty кофе Беларусь",
  ],
  openGraph: {
    title: "Кварта — свежая обжарка кофе в Минске",
    description:
      "Кофе, который попадает к вам на 1–3 день после обжарки. Малые партии по 5 кг от бывших бариста Ани и Дмитрия.",
    type: "website",
    locale: "ru_BY",
  },
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

