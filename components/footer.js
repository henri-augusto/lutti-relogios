import packageJson from "@/package.json";
import FooterContent from "@/components/footer-content";

export default function Footer() {
  return <FooterContent version={packageJson.version} />;
}
