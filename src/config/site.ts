/**
 * Central, editable site configuration.
 * The brand name is a working name: change NEXT_PUBLIC_BRAND_NAME (or the fallback below) and the
 * header, metadata, finale and legal pages all follow.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "BetterMe",
  /** Real App Store link. While empty the CTA honestly says "coming soon". */
  appStoreUrl: process.env.NEXT_PUBLIC_APP_STORE_URL || "",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
} as const;

export const isLaunched = Boolean(siteConfig.appStoreUrl);
