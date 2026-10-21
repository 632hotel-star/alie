import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "الشروط" };

export default function Terms() {
  return (
    <LegalPage title="الشروط">
      <p className="legal__note">مسودة أولية لموقع التعريف. تحتاج مراجعة المالك والجهة القانونية قبل الاعتماد.</p>
      <h2>المحتوى</h2>
      <p>المحتوى في موقع {siteConfig.name} للتعريف بالمنتج فقط. الواجهات والقيم والأرقام المعروضة أمثلة توضيحية، وليست نتائج حقيقية ولا وعداً بنتيجة جسدية أو زمنية.</p>
      <h2>الصحة</h2>
      <p>التطبيق أداة للتنظيم والمتابعة وليس بديلاً عن استشارة مختص صحي أو مدرب مؤهل.</p>
      <h2>التوفر</h2>
      <p>اسم المنتج مؤقت، وقد تتغير المزايا ووقت الإطلاق. لا يُعد هذا الموقع إعلاناً عن نشر التطبيق في App Store ما لم يظهر رابط رسمي.</p>
    </LegalPage>
  );
}
