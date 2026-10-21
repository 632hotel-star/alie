import { isLaunched, siteConfig } from "@/config/site";
import { copy } from "@/config/copy";

/**
 * The one honest download CTA. Real App Store link when configured, otherwise a mailto "register interest"
 * (only if a contact mailbox is configured), otherwise a plain "coming soon" label. Never a fake download link.
 */
export function Cta({ className = "", tone = "paper" }: { className?: string; tone?: "paper" | "gold" | "ghost" }) {
  const base = tone === "gold" ? "btn--gold" : tone === "ghost" ? "btn--ghost" : "btn--primary";
  if (isLaunched) {
    return <a className={`btn ${base} ${className}`} href={siteConfig.appStoreUrl} rel="noopener">{copy.finale.ctaLive}</a>;
  }
  if (siteConfig.contactEmail) {
    const href = `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(`${siteConfig.name}: ${copy.finale.ctaInterest}`)}`;
    return <a className={`btn ${base} ${className}`} href={href}>{copy.finale.ctaInterest}</a>;
  }
  return <span className={`btn ${tone === "gold" ? "btn--ghost btn--goldline" : "btn--ghost"} ${className}`} role="note" aria-disabled="true">{copy.finale.ctaSoon}</span>;
}
