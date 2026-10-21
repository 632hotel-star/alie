import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "الخصوصية", robots: { index: true } };

export default function Privacy() {
  return (
    <LegalPage title="الخصوصية">
      <p className="legal__note">مسودة أولية لموقع التعريف. تحتاج مراجعة المالك والجهة القانونية قبل الاعتماد.</p>
      <h2>هذا الموقع</h2>
      <p>موقع {siteConfig.name} التعريفي لا يستخدم ملفات تعريف ارتباط للتتبع، ولا أدوات تحليلات، ولا نصوصاً برمجية من أطراف ثالثة. لا يطلب الموقع صلاحيات الكاميرا أو الموقع أو بيانات الصحة. كل ما تراه من مسح الباركود والموقع والقياسات هو عرض توضيحي داخل الصفحة.</p>
      <h2>بيانات التواصل</h2>
      <p>إذا راسلتنا عبر البريد، نستخدم رسالتك للرد عليك فقط.</p>
      <h2>التطبيق</h2>
      <p>سياسة الخصوصية الخاصة بتطبيق iPhone، وما يتعلق بالصحة والصور والموقع والتخزين، تُنشر هنا عند إطلاق التطبيق.</p>
    </LegalPage>
  );
}
