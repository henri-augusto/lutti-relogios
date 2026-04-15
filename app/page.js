import HeroBanner from "@/components/hero-banner";
import Benefits from "@/components/benefits";
import HomeFeaturedSection from "@/components/home-featured-section";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-8 sm:px-6 lg:px-8">
      <HeroBanner />
      <HomeFeaturedSection />
      <Benefits />
    </div>
  );
}
