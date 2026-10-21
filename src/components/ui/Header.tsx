import { siteConfig, isLaunched } from "@/config/site";
import { Cta } from "@/components/ui/Cta";
import { logo } from "@/config/characters";

/** Slim header: brand + a single honest CTA (App Store link when it exists, "coming soon" otherwise). */
export function Header() {
  return (
    <header className="site-header">
      <a href="#top" className="brand" aria-label={siteConfig.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.src} srcSet={logo.srcSet} sizes="30px" alt="" width={30} height={29} decoding="async" />
        <span>{siteConfig.name}</span>
      </a>
      <Cta className="header-cta" tone={isLaunched ? "paper" : "ghost"} />
    </header>
  );
}
