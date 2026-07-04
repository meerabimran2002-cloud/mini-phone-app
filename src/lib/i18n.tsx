import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "en", name: "English", rtl: false },
  { code: "ur", name: "اردو", rtl: true },
  { code: "ar", name: "العربية", rtl: true },
  { code: "hi", name: "हिन्दी", rtl: false },
  { code: "fr", name: "Français", rtl: false },
  { code: "es", name: "Español", rtl: false },
  { code: "tr", name: "Türkçe", rtl: false },
  { code: "de", name: "Deutsch", rtl: false },
  { code: "zh", name: "中文", rtl: false },
  { code: "ja", name: "日本語", rtl: false },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

type Dict = Record<string, string>;

const D: Record<LangCode, Dict> = {
  en: {
    appName: "Personal App",
    tagline: "Your personal all-in-one productivity workspace.",
    getStarted: "Get started",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
    name: "Name",
    forgotPassword: "Forgot password?",
    continueWithGoogle: "Continue with Google",
    dashboard: "Dashboard",
    tasks: "Tasks",
    alarms: "Alarms",
    weather: "Weather",
    calculator: "Calculator",
    settings: "Settings",
    admin: "Admin",
    photos: "Photos",
    welcomeBack: "Welcome back",
    todayTasks: "Today's tasks",
    upcomingAlarms: "Upcoming alarms",
    quickCalc: "Quick calculator",
    theme: "Theme",
    language: "Language",
    profile: "Profile",
    ringtone: "Ringtone",
    save: "Save",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    all: "All",
    completed: "Completed",
    active: "Active",
    high: "High",
    medium: "Medium",
    low: "Low",
    addTask: "Add task",
    addAlarm: "Add alarm",
    noTasks: "No tasks yet. Create one to get started.",
    noAlarms: "No alarms set.",
  },

  ur: { appName: "Nimbus", tagline: "آپ کا پریمیم آل اِن وَن پروڈکٹیویٹی ورک اسپیس۔", getStarted: "شروع کریں", signIn: "سائن اِن", signUp: "سائن اپ", signOut: "سائن آؤٹ", email: "ای میل", password: "پاس ورڈ", name: "نام", forgotPassword: "پاس ورڈ بھول گئے؟", continueWithGoogle: "گوگل کے ساتھ جاری رکھیں", dashboard: "ڈیش بورڈ", tasks: "کام", alarms: "الارمز", weather: "موسم", calculator: "کیلکولیٹر", settings: "ترتیبات", admin: "ایڈمن", welcomeBack: "خوش آمدید", todayTasks: "آج کے کام", upcomingAlarms: "آنے والے الارمز", quickCalc: "فوری کیلکولیٹر", theme: "تھیم", language: "زبان", profile: "پروفائل", save: "محفوظ کریں", add: "شامل کریں", edit: "ترمیم", delete: "حذف کریں", search: "تلاش", all: "سب", completed: "مکمل", active: "فعال", high: "زیادہ", medium: "درمیانہ", low: "کم", addTask: "کام شامل کریں", addAlarm: "الارم شامل کریں", noTasks: "ابھی کوئی کام نہیں۔", noAlarms: "کوئی الارم نہیں۔" },
  ar: { appName: "Nimbus", tagline: "مساحة عملك المتميزة الشاملة للإنتاجية.", getStarted: "ابدأ الآن", signIn: "تسجيل الدخول", signUp: "إنشاء حساب", signOut: "تسجيل الخروج", email: "البريد الإلكتروني", password: "كلمة المرور", name: "الاسم", forgotPassword: "نسيت كلمة المرور؟", continueWithGoogle: "المتابعة باستخدام Google", dashboard: "لوحة التحكم", tasks: "المهام", alarms: "المنبهات", weather: "الطقس", calculator: "الآلة الحاسبة", settings: "الإعدادات", admin: "المسؤول", welcomeBack: "مرحبًا بعودتك", todayTasks: "مهام اليوم", upcomingAlarms: "المنبهات القادمة", quickCalc: "حاسبة سريعة", theme: "السمة", language: "اللغة", profile: "الملف الشخصي", save: "حفظ", add: "إضافة", edit: "تعديل", delete: "حذف", search: "بحث", all: "الكل", completed: "مكتمل", active: "نشط", high: "مرتفع", medium: "متوسط", low: "منخفض", addTask: "إضافة مهمة", addAlarm: "إضافة منبه", noTasks: "لا توجد مهام بعد.", noAlarms: "لا توجد منبهات." },
  hi: { appName: "Nimbus", tagline: "आपका प्रीमियम ऑल-इन-वन प्रोडक्टिविटी वर्कस्पेस।", getStarted: "शुरू करें", signIn: "साइन इन", signUp: "साइन अप", signOut: "साइन आउट", email: "ईमेल", password: "पासवर्ड", name: "नाम", forgotPassword: "पासवर्ड भूल गए?", continueWithGoogle: "Google के साथ जारी रखें", dashboard: "डैशबोर्ड", tasks: "कार्य", alarms: "अलार्म", weather: "मौसम", calculator: "कैलकुलेटर", settings: "सेटिंग्स", admin: "एडमिन", welcomeBack: "वापसी पर स्वागत है", todayTasks: "आज के कार्य", upcomingAlarms: "आगामी अलार्म", quickCalc: "त्वरित कैलकुलेटर", theme: "थीम", language: "भाषा", profile: "प्रोफ़ाइल", save: "सहेजें", add: "जोड़ें", edit: "संपादित", delete: "हटाएं", search: "खोजें", all: "सभी", completed: "पूर्ण", active: "सक्रिय", high: "उच्च", medium: "मध्यम", low: "निम्न", addTask: "कार्य जोड़ें", addAlarm: "अलार्म जोड़ें", noTasks: "अभी कोई कार्य नहीं।", noAlarms: "कोई अलार्म नहीं।" },
  fr: { appName: "Nimbus", tagline: "Votre espace de productivité tout-en-un premium.", getStarted: "Commencer", signIn: "Se connecter", signUp: "S'inscrire", signOut: "Se déconnecter", email: "E-mail", password: "Mot de passe", name: "Nom", forgotPassword: "Mot de passe oublié ?", continueWithGoogle: "Continuer avec Google", dashboard: "Tableau de bord", tasks: "Tâches", alarms: "Alarmes", weather: "Météo", calculator: "Calculatrice", settings: "Paramètres", admin: "Admin", welcomeBack: "Bon retour", todayTasks: "Tâches du jour", upcomingAlarms: "Prochaines alarmes", quickCalc: "Calcul rapide", theme: "Thème", language: "Langue", profile: "Profil", save: "Enregistrer", add: "Ajouter", edit: "Modifier", delete: "Supprimer", search: "Rechercher", all: "Toutes", completed: "Terminées", active: "Actives", high: "Haute", medium: "Moyenne", low: "Basse", addTask: "Ajouter une tâche", addAlarm: "Ajouter une alarme", noTasks: "Aucune tâche.", noAlarms: "Aucune alarme." },
  es: { appName: "Nimbus", tagline: "Tu espacio de productividad todo en uno premium.", getStarted: "Comenzar", signIn: "Iniciar sesión", signUp: "Registrarse", signOut: "Cerrar sesión", email: "Correo", password: "Contraseña", name: "Nombre", forgotPassword: "¿Olvidaste la contraseña?", continueWithGoogle: "Continuar con Google", dashboard: "Panel", tasks: "Tareas", alarms: "Alarmas", weather: "Clima", calculator: "Calculadora", settings: "Ajustes", admin: "Admin", welcomeBack: "Bienvenido de nuevo", todayTasks: "Tareas de hoy", upcomingAlarms: "Próximas alarmas", quickCalc: "Cálculo rápido", theme: "Tema", language: "Idioma", profile: "Perfil", save: "Guardar", add: "Añadir", edit: "Editar", delete: "Eliminar", search: "Buscar", all: "Todas", completed: "Completadas", active: "Activas", high: "Alta", medium: "Media", low: "Baja", addTask: "Añadir tarea", addAlarm: "Añadir alarma", noTasks: "Sin tareas.", noAlarms: "Sin alarmas." },
  tr: { appName: "Nimbus", tagline: "Premium hepsi bir arada üretkenlik alanınız.", getStarted: "Başla", signIn: "Giriş yap", signUp: "Kaydol", signOut: "Çıkış yap", email: "E-posta", password: "Şifre", name: "Ad", forgotPassword: "Şifremi unuttum", continueWithGoogle: "Google ile devam et", dashboard: "Panel", tasks: "Görevler", alarms: "Alarmlar", weather: "Hava", calculator: "Hesap makinesi", settings: "Ayarlar", admin: "Yönetici", welcomeBack: "Tekrar hoş geldiniz", todayTasks: "Bugünün görevleri", upcomingAlarms: "Yaklaşan alarmlar", quickCalc: "Hızlı hesap", theme: "Tema", language: "Dil", profile: "Profil", save: "Kaydet", add: "Ekle", edit: "Düzenle", delete: "Sil", search: "Ara", all: "Tümü", completed: "Tamamlandı", active: "Aktif", high: "Yüksek", medium: "Orta", low: "Düşük", addTask: "Görev ekle", addAlarm: "Alarm ekle", noTasks: "Henüz görev yok.", noAlarms: "Alarm yok." },
  de: { appName: "Nimbus", tagline: "Dein Premium-All-in-One-Produktivitätsraum.", getStarted: "Loslegen", signIn: "Anmelden", signUp: "Registrieren", signOut: "Abmelden", email: "E-Mail", password: "Passwort", name: "Name", forgotPassword: "Passwort vergessen?", continueWithGoogle: "Mit Google fortfahren", dashboard: "Übersicht", tasks: "Aufgaben", alarms: "Wecker", weather: "Wetter", calculator: "Rechner", settings: "Einstellungen", admin: "Admin", welcomeBack: "Willkommen zurück", todayTasks: "Heutige Aufgaben", upcomingAlarms: "Kommende Wecker", quickCalc: "Schnellrechner", theme: "Thema", language: "Sprache", profile: "Profil", save: "Speichern", add: "Hinzufügen", edit: "Bearbeiten", delete: "Löschen", search: "Suchen", all: "Alle", completed: "Erledigt", active: "Aktiv", high: "Hoch", medium: "Mittel", low: "Niedrig", addTask: "Aufgabe hinzufügen", addAlarm: "Wecker hinzufügen", noTasks: "Keine Aufgaben.", noAlarms: "Keine Wecker." },
  zh: { appName: "Nimbus", tagline: "您的高级一体化生产力工作空间。", getStarted: "开始使用", signIn: "登录", signUp: "注册", signOut: "退出", email: "邮箱", password: "密码", name: "姓名", forgotPassword: "忘记密码？", continueWithGoogle: "使用 Google 继续", dashboard: "仪表板", tasks: "任务", alarms: "闹钟", weather: "天气", calculator: "计算器", settings: "设置", admin: "管理员", welcomeBack: "欢迎回来", todayTasks: "今日任务", upcomingAlarms: "即将到来的闹钟", quickCalc: "快速计算", theme: "主题", language: "语言", profile: "个人资料", save: "保存", add: "添加", edit: "编辑", delete: "删除", search: "搜索", all: "全部", completed: "已完成", active: "进行中", high: "高", medium: "中", low: "低", addTask: "添加任务", addAlarm: "添加闹钟", noTasks: "暂无任务。", noAlarms: "暂无闹钟。" },
  ja: { appName: "Nimbus", tagline: "プレミアムなオールインワン生産性ワークスペース。", getStarted: "はじめる", signIn: "サインイン", signUp: "サインアップ", signOut: "サインアウト", email: "メール", password: "パスワード", name: "名前", forgotPassword: "パスワードをお忘れ？", continueWithGoogle: "Google で続行", dashboard: "ダッシュボード", tasks: "タスク", alarms: "アラーム", weather: "天気", calculator: "電卓", settings: "設定", admin: "管理者", welcomeBack: "おかえりなさい", todayTasks: "今日のタスク", upcomingAlarms: "次のアラーム", quickCalc: "クイック計算", theme: "テーマ", language: "言語", profile: "プロフィール", save: "保存", add: "追加", edit: "編集", delete: "削除", search: "検索", all: "すべて", completed: "完了", active: "アクティブ", high: "高", medium: "中", low: "低", addTask: "タスクを追加", addAlarm: "アラームを追加", noTasks: "タスクはありません。", noAlarms: "アラームはありません。" },
};

interface I18nCtx {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (k: string) => string;
  rtl: boolean;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as LangCode | null;
    if (stored && D[stored]) setLangState(stored);
  }, []);

  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang)!;
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.rtl ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: LangCode) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (k: string) => D[lang]?.[k] ?? D.en[k] ?? k;
  const rtl = LANGUAGES.find((l) => l.code === lang)?.rtl ?? false;

  return <Ctx.Provider value={{ lang, setLang, t, rtl }}>{children}</Ctx.Provider>;
}

export const useI18n = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
};
