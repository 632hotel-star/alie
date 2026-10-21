import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { copy } from "@/config/copy";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: `${siteConfig.name} | ${copy.htmlTitle}`, template: `%s | ${siteConfig.name}` },
  description: copy.description,
  applicationName: siteConfig.name,
  openGraph: {
    title: `${siteConfig.name} | ${copy.htmlTitle}`, description: copy.description, locale: "ar_SA", type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: `${siteConfig.name} | ${copy.htmlTitle}`, description: copy.description, images: ["/og.png"] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#000000", colorScheme: "dark",
};

const fontsToPreload = ["kufi-arabic", "plex-arabic-400", "plex-arabic-600", "plex-latin-400", "geist-latin"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {fontsToPreload.map((f) => (
          <link key={f} rel="preload" href={`/fonts/${f}.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body id="top">
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
