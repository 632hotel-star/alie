import Link from "next/link";
import { siteConfig } from "@/config/site";
import { logo } from "@/config/characters";

/** Plain, readable shell for the privacy / terms / contact pages. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="legal">
      <header className="legal__bar">
        <Link href="/" className="brand" aria-label={siteConfig.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.src} srcSet={logo.srcSet} sizes="30px" alt="" width={30} height={29} />
          <span>{siteConfig.name}</span>
        </Link>
        <Link href="/" className="btn btn--ghost header-cta">الرئيسية</Link>
      </header>
      <article className="legal__body">
        <h1 className="t-display">{title}</h1>
        {children}
      </article>
    </main>
  );
}
