import HeroBanner from "@/components/hero-banner";
import Benefits from "@/components/benefits";
import HomeFeaturedSection from "@/components/home-featured-section";
import BrandsSection from "@/components/brands-section";
import AboutSection from "@/components/about-section";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <HomeFeaturedSection />
        <BrandsSection />
        <AboutSection />
        <Benefits />
      </div>
    </>
  );
}
