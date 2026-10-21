import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "تواصل" };

export default function Contact() {
  const mail = siteConfig.contactEmail;
  return (
    <LegalPage title="تواصل">
      {mail ? (
        <>
          <p>للاستفسارات والاقتراحات، راسلنا على البريد التالي.</p>
          <p><a className="btn btn--primary" href={`mailto:${mail}`}><span className="num">{mail}</span></a></p>
        </>
      ) : (
        <p className="legal__note">لم يُحدد بريد التواصل بعد. يضيفه المالك في المتغير NEXT_PUBLIC_CONTACT_EMAIL.</p>
      )}
    </LegalPage>
  );
}
