import HeroBanner from "@/components/hero-banner";
import Benefits from "@/components/benefits";
import HomeFeaturedSection from "@/components/home-featured-section";
import BrandsSection from "@/components/brands-section";
import AboutSection from "@/components/about-section";
import RevendedoresSection from "@/components/revendedores-section";
import ScrollRevealOnView from "@/components/scroll-reveal-on-view";
import Testimonials from "@/components/testimonials";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="relative min-h-screen pb-24">
      <div
        className="fixed inset-0 -z-20"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(214, 172, 98, 0.1) 0, rgba(214, 172, 98, 0) 32%), radial-gradient(circle at 78% 12%, rgba(160, 165, 173, 0.08) 0, rgba(160, 165, 173, 0) 28%), radial-gradient(circle at 50% 78%, rgba(133, 99, 47, 0.08) 0, rgba(133, 99, 47, 0) 34%), linear-gradient(135deg, #ffffff 0%, #fdfdfd 48%, #fafaf8 100%)",
        }}
      />
      <div
        className="fixed inset-0 -z-10 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px)",
          backgroundSize: "62px 62px",
        }}
      />

      <div className="relative z-10">
        <ScrollRevealOnView />
        <HeroBanner />
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="landing-stack">
            <HomeFeaturedSection />
            <BrandsSection />
            <AboutSection />
            <RevendedoresSection />
            <Benefits />
            <Testimonials />
          </div>
        </div>
      </div>
    </div>
  );
}
