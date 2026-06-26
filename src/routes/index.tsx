import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckSquare, Bell, CloudSun, Calculator, Sparkles, Globe, Palette, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nimbus — Your premium all-in-one productivity workspace" },
      { name: "description", content: "Tasks, alarms, weather, calculator, themes and i18n in one beautiful workspace." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const features = [
    { icon: CheckSquare, title: "Tasks", desc: "Plan, prioritize and ship." },
    { icon: Bell, title: "Alarms", desc: "Never miss a moment." },
    { icon: CloudSun, title: "Weather", desc: "Live forecasts anywhere." },
    { icon: Calculator, title: "Calculator", desc: "Basic + scientific modes." },
    { icon: Palette, title: "8 Themes", desc: "Light, dark, AMOLED, more." },
    { icon: Globe, title: "10 Languages", desc: "Including RTL support." },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full opacity-40" style={{ background: "var(--gradient-hero)", filter: "blur(80px)" }} />
        <div className="animate-blob absolute top-1/3 -right-20 h-[380px] w-[380px] rounded-full opacity-30" style={{ background: "var(--gradient-hero)", filter: "blur(90px)", animationDelay: "4s" }} />
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl shadow-lg" style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Nimbus</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent">{t("signIn")}</Link>
          <Link to="/auth" search={{ mode: "signup" } as any} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition hover:opacity-90">{t("getStarted")}</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-20 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure · Multi-user · Cross-platform
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
          One workspace for <span className="text-gradient">everything you do</span> in a day.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("tagline")} Tasks, alarms, weather, a powerful calculator, eight themes and ten languages — all beautifully unified.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" } as any} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl transition hover:opacity-90" style={{ boxShadow: "var(--shadow-glow)" }}>
            {t("getStarted")} →
          </Link>
          <Link to="/auth" className="rounded-xl glass px-6 py-3 text-sm font-semibold">{t("signIn")}</Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl card-elevated p-6 transition hover:-translate-y-1">
              <div className="grid h-11 w-11 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nimbus. Crafted with care.
      </footer>
    </div>
  );
}
