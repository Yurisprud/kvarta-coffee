import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { FreshnessTimeline } from "@/components/sections/FreshnessTimeline";
import { Catalog } from "@/components/sections/Catalog";
import { Subscription } from "@/components/sections/Subscription";
import { Delivery } from "@/components/sections/Delivery";
import { LeadForm } from "@/components/sections/LeadForm";
import { Footer } from "@/components/sections/Footer";

/**
 * Главная страница лендинга «Кварта».
 * Собирает смысловые блоки в порядке пользовательского пути:
 * привлечение (Hero) → ценность (свежесть) → предложение (каталог,
 * подписка) → логистика (доставка) → конверсия (форма).
 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <FreshnessTimeline />
        <Catalog />
        <Subscription />
        <Delivery />
        <LeadForm />
      </main>
      <Footer />
    </>
  );
}
