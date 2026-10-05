// Every visible string lives here, in both languages. Only product and brand names
// (A.L.I.E. 2, ChatGPT, Claude, Gemini, Alexa, Siri, Home Assistant) stay as they are.
export const STRINGS = {
  en: {
    'nav.sound.on': 'Sound on',
    'nav.sound.off': 'Sound off',
    'nav.lang': 'العربية',
    'hero.tag': 'Your AI. Always there. Always evolving.',

    'memory.h': 'Persistent memory',
    'memory.p': "A.L.I.E. 2 doesn't start from zero every time. It remembers what matters, keeps learning from you, and builds on it.",
    'memory.d1': 'Day 1',
    'memory.d2': 'Day 7',
    'memory.d3': 'Day 30',
    'memory.d4': 'Day 365',
    'memory.n1': 'A first conversation. It knows almost nothing.',
    'memory.n2': 'Routines and preferences begin to show.',
    'memory.n3': 'Projects, people and context carry over.',
    'memory.n4': 'A year of shared history in one connected network.',
    'claim.memory': 'One AI that actually grows with you.',

    'evolve.h': 'An intelligence you can develop from the inside.',
    'evolve.p': 'Ask it to add capabilities, reshape its interface, improve how it works or extend parts of its own system.',
    'evolve.say': 'Add the ability to plan my week to yourself.',
    'evolve.s1': 'Writing module…',
    'evolve.s2': 'Connecting to memory…',
    'evolve.s3': 'Module ready.',

    'control.h': 'Not a chatbot. An agent that does the work.',
    'control.p': 'It uses tools, works on the device and carries out tasks with many steps, from the first search to the final action.',
    'control.say': 'Find the best option, compare them, and get it done.',
    'step.1': 'Research',
    'step.2': 'Compare',
    'step.3': 'Decide',
    'step.4': 'Execute',
    'step.5': 'Done',
    'claim.device': 'Don’t ask how. Ask A.L.I.E. to do it.',

    'home.h': 'The intelligence behind your home.',
    'home.p': 'Through Home Assistant, A.L.I.E. controls your devices and builds scenes and automations from what you ask for.',
    'home.say': "A.L.I.E., I'm home.",
    'dev.1': 'Lights',
    'dev.2': 'TV',
    'dev.3': 'AC',
    'dev.4': 'Curtains',
    'dev.5': 'Sensors',
    'dev.6': 'Scenes',
    'claim.home': 'Your home no longer needs a separate assistant.',

    'study.h': 'It turns your course into a learning experience.',
    'study.p': 'Drop in a PDF. A.L.I.E. reads it, understands it and builds everything you need to learn it.',
    'out.1': 'Interactive Website',
    'out.2': 'Visual Explanation',
    'out.3': 'Quiz',
    'out.4': 'Flashcards',
    'out.5': 'Study Plan',

    'create.h': 'Build anything. Keep refining it by talking.',
    'create.p': 'Projects, documents and files take shape from a sentence, then change as you keep talking to it.',
    'create.say1': 'Build me a website for this idea.',
    'create.say2': 'Make it more minimal.',
    'type.1': 'Website',
    'type.2': 'Document',
    'type.3': 'Presentation',
    'type.4': 'Spreadsheet',
    'type.5': 'Image',
    'type.6': 'Video',
    'claim.build': 'Build. Edit. Iterate. Without leaving A.L.I.E.',

    'agent.h': 'A personal agent that keeps working.',
    'agent.p': 'It keeps watching what you care about after the conversation ends, and tells you when something changes.',
    'agent.say': "Watch this and tell me when it's available.",
    'agent.mon': 'Monitoring…',
    'agent.ok': "Available. I'll let you know.",
    'orbit.1': 'Flights',
    'orbit.2': 'Events',
    'orbit.3': 'Reservations',
    'orbit.4': 'Research',
    'orbit.5': 'Tracking',
    'orbit.6': 'Reminders',

    'mon.1': 'Monitoring',
    'mon.2': 'Tracking',
    'mon.3': 'Tasks',
    'mon.4': 'Reminders',
    'mon.5': 'Background Work',
    'seek.new': 'New capability',
    'seek.nrf': 'No replacement found',
    'seek.because': 'Because this isn’t replacing something.',
    'seek.nothing': 'It’s something you didn’t have before.',
    'seek.ex1': 'Watch this price and tell me if it drops.',
    'seek.ex2': 'Keep an eye on when this product is back in stock.',
    'seek.ex3': 'Check my order status and tell me if it changes.',
    'seek.ex4': 'Remind me when this happens, not at a set time.',

    'creative.h': 'Images and video from the same place.',
    'creative.p': 'A.L.I.E. connects to different generation services, so creative work happens inside one system.',
    'kind.1': 'Image Generation',
    'kind.2': 'Video Generation',
    'kind.3': 'Creative Work',
    'claim.create': 'Creation becomes part of your intelligence.',

    'iface.h1': "A.L.I.E. doesn't have one interface.",
    'iface.h2': 'It becomes the interface it needs.',
    'state.1': 'Listening',
    'state.2': 'Thinking',
    'state.3': 'Searching',
    'state.4': 'Coding',
    'state.5': 'Home',
    'state.6': 'Study',
    'state.7': 'Creating',

    'meet.h': 'This is A.L.I.E.',
    'meet.1': 'Not an app.',
    'meet.2': 'Not a chatbot.',
    'meet.3': 'An intelligence that lives with you.',

    'node.1': 'Computer',
    'node.2': 'Home',
    'node.3': 'Study',
    'node.4': 'Work',
    'node.5': 'Web',
    'node.6': 'Files',
    'node.7': 'Images',
    'node.8': 'Video',
    'node.9': 'Automations',
    'node.10': 'Memory',
    'one.ai': 'ONE AI.',
    'one.connected': 'Everything connected.',

    'before.h': 'Before you start',
    'before.1.h': 'Home Assistant',
    'before.1.p': 'Controlling your home requires Home Assistant to be installed and set up in advance, with your devices and integrations ready.',
    'before.2.h': 'Prototype',
    'before.2.p': 'A.L.I.E. 2 is still an early prototype in development. Some features may not work fully, and improvements, fixes and updates keep arriving.',
    'before.3.h': 'API based',
    'before.3.p': 'Some capabilities rely on external APIs and services, such as AI models, voice, search, images and video.',
    'before.4.h': 'Pay for what you use',
    'before.4.p': "The cost of third-party services is not part of A.L.I.E. 2. You pay each provider's API cost based on your own usage.",
    'before.5.h': 'Integrations',
    'before.5.p': 'Some features need the service to be set up and connected, with the right permissions granted before you use them.',

    'cap.1': 'Memory',
    'cap.2': 'Build',
    'cap.3': 'Create',
    'cap.4': 'Home',
    'cap.5': 'Device',
    'five.1': 'Five assistants.',
    'five.2': 'Dozens of tools.',
    'five.3': 'One intelligence.',

    'end.s1': 'Everything you need.',
    'end.s2': 'One AI that knows you.',
    'end.l1': 'A memory that knows you.',
    'end.l2': 'An intelligence that learns from you.',
    'end.l3': 'A system that acts for you.',
    'end.l4': 'A platform that evolves with you.',
    'end.cta': 'Experience A.L.I.E.',
  },
  ar: {
    'nav.sound.on': 'الصوت يعمل',
    'nav.sound.off': 'الصوت متوقف',
    'nav.lang': 'English',
    'hero.tag': 'ذكاؤك الاصطناعي. حاضر دائماً. يتطور باستمرار.',

    'memory.h': 'ذاكرة دائمة',
    'memory.p': 'A.L.I.E. 2 لا يبدأ من الصفر كل مرة. يتذكر المعلومات والسياقات المهمة ويتعلم منك باستمرار.',
    'memory.d1': 'اليوم 1',
    'memory.d2': 'اليوم 7',
    'memory.d3': 'اليوم 30',
    'memory.d4': 'اليوم 365',
    'memory.n1': 'أول محادثة. لا يعرف عنك إلا القليل.',
    'memory.n2': 'تبدأ عاداتك وتفضيلاتك بالظهور.',
    'memory.n3': 'المشاريع والأشخاص والسياق تنتقل معك.',
    'memory.n4': 'عام كامل من التاريخ المشترك في شبكة واحدة.',
    'claim.memory': 'ذكاء واحد يكبر معك فعلاً.',

    'evolve.h': 'ذكاء تستطيع تطويره من خلاله.',
    'evolve.p': 'يمكنك أن تطلب من A.L.I.E. إضافة قدرات، تعديل واجهته، تحسين طريقة عمله أو تطوير أجزاء من نظامه.',
    'evolve.say': 'أضف لنفسك القدرة على تخطيط أسبوعي.',
    'evolve.s1': 'تتم كتابة الوحدة…',
    'evolve.s2': 'تتم إضافتها إلى الذاكرة…',
    'evolve.s3': 'الوحدة جاهزة.',

    'control.h': 'ليس مجرد روبوت محادثة. بل وكيل ينفذ المهام.',
    'control.p': 'يستخدم الأدوات ويعمل على الجهاز وينفذ مهام متعددة الخطوات، من أول بحث حتى الإجراء الأخير.',
    'control.say': 'ابحث عن أفضل خيار، قارن بينهم، ونفذ المهمة.',
    'step.1': 'بحث',
    'step.2': 'مقارنة',
    'step.3': 'قرار',
    'step.4': 'تنفيذ',
    'step.5': 'تم',
    'claim.device': 'لا تسأل كيف. اطلب من A.L.I.E. أن ينفذها.',

    'home.h': 'الذكاء الذي يدير منزلك.',
    'home.p': 'عبر Home Assistant، يتحكم A.L.I.E. بالأجهزة ويبني مشاهد وأتمتة بناءً على ما تطلبه.',
    'home.say': 'A.L.I.E.، أنا في البيت.',
    'dev.1': 'الإضاءة',
    'dev.2': 'التلفاز',
    'dev.3': 'المكيف',
    'dev.4': 'الستائر',
    'dev.5': 'الحساسات',
    'dev.6': 'المشاهد',
    'claim.home': 'منزلك لم يعد بحاجة إلى مساعد منفصل.',

    'study.h': 'يحوّل منهجك إلى تجربة تعليمية كاملة.',
    'study.p': 'أرفق ملف PDF. يقرأه A.L.I.E. ويفهمه، ثم يبني كل ما تحتاجه لتتعلمه.',
    'out.1': 'موقع تفاعلي',
    'out.2': 'شرح مرئي',
    'out.3': 'اختبار',
    'out.4': 'بطاقات مراجعة',
    'out.5': 'خطة دراسة',

    'create.h': 'أنشئ أي شيء. وواصل تعديله بالمحادثة.',
    'create.p': 'تتشكل المشاريع والملفات من جملة واحدة، ثم تتغير كلما واصلت الحديث معه.',
    'create.say1': 'ابنِ لي موقعاً لهذه الفكرة.',
    'create.say2': 'اجعله أكثر بساطة.',
    'type.1': 'موقع',
    'type.2': 'مستند',
    'type.3': 'عرض تقديمي',
    'type.4': 'جدول بيانات',
    'type.5': 'صورة',
    'type.6': 'فيديو',
    'claim.build': 'ابنِ. عدّل. طوّر. دون أن تغادر A.L.I.E.',

    'agent.h': 'وكيل شخصي يواصل العمل.',
    'agent.p': 'يتابع ما يهمك حتى بعد انتهاء المحادثة، ويخبرك عندما يتغير شيء.',
    'agent.say': 'راقب هذا وأخبرني عندما يتوفر.',
    'agent.mon': 'تتم المتابعة…',
    'agent.ok': 'أصبح متوفراً. سأخبرك.',
    'orbit.1': 'رحلات الطيران',
    'orbit.2': 'الفعاليات',
    'orbit.3': 'الحجوزات',
    'orbit.4': 'البحث',
    'orbit.5': 'التتبع',
    'orbit.6': 'التذكيرات',

    'mon.1': 'المتابعة',
    'mon.2': 'التتبع',
    'mon.3': 'المهام',
    'mon.4': 'التذكيرات',
    'mon.5': 'العمل في الخلفية',
    'seek.new': 'قدرة جديدة',
    'seek.nrf': 'لا يوجد بديل',
    'seek.because': 'لأن هذا لا يستبدل شيئاً.',
    'seek.nothing': 'إنه شيء لم يكن لديك من قبل.',
    'seek.ex1': 'راقب هذا السعر وأخبرني إذا انخفض.',
    'seek.ex2': 'تابع توفر هذا المنتج.',
    'seek.ex3': 'شيّك على حالة طلبي وأخبرني إذا تغيرت.',
    'seek.ex4': 'ذكّرني عندما يحدث هذا، وليس في وقت محدد.',

    'creative.h': 'الصور والفيديو من مكان واحد.',
    'creative.p': 'يستخدم A.L.I.E. خدمات التوليد المختلفة، فيبقى العمل الإبداعي داخل نظام واحد.',
    'kind.1': 'توليد الصور',
    'kind.2': 'توليد الفيديو',
    'kind.3': 'العمل الإبداعي',
    'claim.create': 'الإبداع يصبح جزءاً من ذكائك.',

    'iface.h1': 'لا يملك A.L.I.E. واجهة واحدة.',
    'iface.h2': 'بل يصبح الواجهة التي تحتاجها.',
    'state.1': 'يستمع',
    'state.2': 'يفكر',
    'state.3': 'يبحث',
    'state.4': 'يبرمج',
    'state.5': 'المنزل',
    'state.6': 'الدراسة',
    'state.7': 'يبدع',

    'meet.h': 'هذا هو A.L.I.E.',
    'meet.1': 'ليس تطبيقاً.',
    'meet.2': 'ليس روبوت محادثة.',
    'meet.3': 'ذكاء يعيش معك.',

    'node.1': 'الكمبيوتر',
    'node.2': 'المنزل',
    'node.3': 'الدراسة',
    'node.4': 'العمل',
    'node.5': 'الويب',
    'node.6': 'الملفات',
    'node.7': 'الصور',
    'node.8': 'الفيديو',
    'node.9': 'الأتمتة',
    'node.10': 'الذاكرة',
    'one.ai': 'ذكاء واحد',
    'one.connected': 'كل شيء متصل.',

    'before.h': 'قبل أن تبدأ',
    'before.1.h': 'Home Assistant',
    'before.1.p': 'التحكم بالمنزل يتطلب Home Assistant مثبتاً ومجهزاً مسبقاً مع الأجهزة والتكاملات المطلوبة.',
    'before.2.h': 'نموذج أولي',
    'before.2.p': 'A.L.I.E. 2 ما زال نموذجاً أولياً قيد التطوير. قد لا تعمل بعض الخصائص بشكل كامل، وستصل تحسينات وإصلاحات وتحديثات باستمرار.',
    'before.3.h': 'يعتمد على الـ API',
    'before.3.p': 'بعض القدرات تعتمد على واجهات API وخدمات خارجية مثل نماذج الذكاء الاصطناعي والصوت والبحث والصور والفيديو.',
    'before.4.h': 'ادفع مقابل ما تستخدم',
    'before.4.p': 'تكاليف خدمات الشركات الخارجية ليست ضمن A.L.I.E. 2. تدفع تكلفة الـ API الخاصة بكل خدمة بناءً على استخدامك.',
    'before.5.h': 'التكاملات',
    'before.5.p': 'بعض المميزات تحتاج إعداد وربط الخدمة المطلوبة وإعطاء الصلاحيات المناسبة قبل استخدامها.',

    'cap.1': 'الذاكرة',
    'cap.2': 'البناء',
    'cap.3': 'الإبداع',
    'cap.4': 'المنزل',
    'cap.5': 'الجهاز',
    'five.1': 'خمسة مساعدين.',
    'five.2': 'عشرات الأدوات.',
    'five.3': 'ذكاء واحد.',

    'end.s1': 'كل ما تحتاجه.',
    'end.s2': 'ذكاء واحد يعرفك.',
    'end.l1': 'ذاكرة تعرفك.',
    'end.l2': 'ذكاء يتعلم منك.',
    'end.l3': 'نظام ينفذ من أجلك.',
    'end.l4': 'ومنصة تتطور معك.',
    'end.cta': 'جرّب A.L.I.E.',
  },
};

export function detectLang() {
  try {
    const saved = localStorage.getItem('alie-lang');
    if (saved === 'ar' || saved === 'en') return saved;
  } catch (e) {
    /* storage unavailable */
  }
  return (navigator.language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

// keep the brand mark and its dot together inside right-to-left sentences
const isolate = (s) => s.replace(/A\.L\.I\.E\.(?: 2)?/g, '\u2066$&\u2069');
export function applyLang(lang) {
  const raw = STRINGS[lang];
  const dict = lang === 'ar' ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, isolate(v)])) : raw;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = dict[el.dataset.i18n];
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-say]').forEach((el) => {
    el.dataset.full = dict[el.dataset.say] || '';
    el._t = undefined;
  });
  document.title = 'A.L.I.E. 2';
  try {
    localStorage.setItem('alie-lang', lang);
  } catch (e) {
    /* ignore */
  }
}
