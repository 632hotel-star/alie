/** All visible marketing copy in one place (Arabic). No testimonials, ratings, download counts or result claims. */
export const copy = {
  htmlTitle: "التغيير يبدأ بالالتزام",
  description: "تطبيق iPhone يجمع خطة تمرين بالذكاء الاصطناعي، وسجل التمرين، والتغذية والباركود، والالتزام بالنادي، وتطور الجسم بمكان واحد.",
  hero: { title: "التغيير يبدأ بالالتزام.", sub: "تمرينك. أكلك. تطورك. بمكان واحد.", cta: "ابدأ رحلتك", more: "اكتشف المميزات" },
  plan: { title: "خطتك تبدأ منك." },
  train: { title: "كل عدّة تصنع فرق." },
  fuel: { title: "أكلك صار أسهل." },
  commit: { title: "الحماس يبدأك. الالتزام يكمّلك." },
  progress: { title: "شوف التغيير." },
  coach: { title: "مدرب يفهم رحلتك." },
  widgets: { title: "معك على شاشتك." },
  finale: { title: "نسختك الأفضل تبدأ اليوم.", sub: "ابدأ مجاناً. واستمر بطريقتك.", device: "مصمم لـ iPhone.", ctaLive: "حمّل من App Store", ctaInterest: "سجّل اهتمامك", ctaSoon: "قريباً على iPhone" },
  footer: { privacy: "الخصوصية", terms: "الشروط", contact: "تواصل" },
  skip: "تخطي إلى المحتوى", skipFilm: "تخطي المشاهد والانتقال للنهاية",
} as const;

export const chapters = [
  { id: "hero", label: "البداية" },
  { id: "plan", label: "خطتك" },
  { id: "train", label: "التمرين" },
  { id: "fuel", label: "التغذية" },
  { id: "commit", label: "الالتزام" },
  { id: "progress", label: "التطور" },
  { id: "coach", label: "المدرب" },
  { id: "widgets", label: "ختام" },
] as const;
