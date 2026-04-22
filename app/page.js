import HeroBanner from "@/components/hero-banner";
import Benefits from "@/components/benefits";
import HomeFeaturedSection from "@/components/home-featured-section";
import BrandsSection from "@/components/brands-section";
import AboutSection from "@/components/about-section";
import Testimonials from "@/components/testimonials";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 sm:gap-28 lg:gap-32 px-4 pb-28 pt-4 sm:px-6 sm:pb-32 lg:px-8">
        <HomeFeaturedSection />
        <BrandsSection />
        <AboutSection />
        <Testimonials />
        <Benefits />
      </div>
    </>
  );
}
