import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckSquare, Bell, CloudSun, Calculator, Sparkles, Globe, Palette, ShieldCheck, LayoutDashboard, Settings, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nimbus — Your premium all-in-one productivity workspace" },
      { name: "description", content: "Tasks, alarms, weather, calculator, themes and i18n in one beautiful workspace." },
    ],
  }),
  component: Landing,
});

type Tile = { to: string; icon: any; title: string; desc: string; tint: string };

function Landing() {
  const { t } = useI18n();
  const { session, isAdmin } = useAuth();

  const tiles: Tile[] = [
    { to: "/dashboard",  icon: LayoutDashboard, title: t("dashboard"),  desc: "Your day at a glance",     tint: "from-indigo-500 to-violet-500" },
    { to: "/tasks",      icon: CheckSquare,     title: t("tasks"),      desc: "Plan & prioritize",        tint: "from-emerald-500 to-teal-500" },
    { to: "/alarms",     icon: Bell,            title: t("alarms"),     desc: "Never miss a moment",      tint: "from-amber-500 to-orange-500" },
    { to: "/weather",    icon: CloudSun,        title: t("weather"),    desc: "Live forecasts anywhere",  tint: "from-sky-500 to-cyan-500" },
    { to: "/calculator", icon: Calculator,      title: t("calculator"), desc: "Basic + scientific",       tint: "from-fuchsia-500 to-pink-500" },
    { to: "/settings",   icon: Settings,        title: t("settings"),   desc: "Theme · language · you",   tint: "from-rose-500 to-red-500" },
  ];

  const open = (to: string) => (session ? to : "/auth");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full opacity-40" style={{ background: "var(--gradient-hero)", filter: "blur(80px)" }} />
        <div className="animate-blob absolute top-1/3 -right-20 h-[380px] w-[380px] rounded-full opacity-30" style={{ background: "var(--gradient-hero)", filter: "blur(90px)", animationDelay: "4s" }} />
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl shadow-lg" style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Nimbus</span>
        </Link>
        <div className="flex items-center gap-2">
          {session ? (
            <Link to="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition hover:opacity-90">
              Open App
            </Link>
          ) : (
            <>
              <Link to="/auth" className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent">{t("signIn")}</Link>
              <Link to="/auth" search={{ mode: "signup" } as any} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition hover:opacity-90">{t("getStarted")}</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-10 pb-12 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure · Multi-user · Cross-platform
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
          Welcome <span className="text-gradient">Everyone</span> 👋
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          {t("tagline")} Tap any tile below to open it — tasks, alarms, weather and more, all in one beautiful app.
        </p>
        {!session && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" } as any} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl transition hover:opacity-90" style={{ boxShadow: "var(--shadow-glow)" }}>
              {t("getStarted")} →
            </Link>
            <Link to="/auth" className="rounded-xl glass px-6 py-3 text-sm font-semibold">{t("signIn")}</Link>
          </div>
        )}
      </section>

      {/* App tile grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-10">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {tiles.map((tile) => (
            <Link
              key={tile.to}
              to={open(tile.to)}
              className="group relative flex flex-col items-center gap-3 rounded-3xl card-elevated p-5 text-center transition hover:-translate-y-1 hover:shadow-2xl active:scale-95"
            >
              <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${tile.tint} text-white shadow-lg`}>
                <tile.icon className="h-7 w-7" />
              </div>
              <div>
                <div className="text-sm font-semibold">{tile.title}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{tile.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Admin Portal CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="overflow-hidden rounded-3xl card-elevated p-8 md:flex md:items-center md:justify-between md:gap-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: "var(--gradient-hero)" }}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Admin Portal</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Sign in as an admin to view all registered users, their profiles, themes, languages and join dates.
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-2 md:mt-0">
            {session ? (
              isAdmin ? (
                <Link to="/admin" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90">
                  Open Admin Portal <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl glass px-5 py-3 text-sm font-semibold">
                  Go to Dashboard
                </Link>
              )
            ) : (
              <>
                <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90">
                  Admin Login <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/auth" search={{ mode: "signup" } as any} className="inline-flex items-center gap-2 rounded-xl glass px-5 py-3 text-sm font-semibold">
                  User Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Palette, title: "8 Themes", desc: "Light, dark, AMOLED, blue, purple, green, pink, orange." },
            { icon: Globe, title: "10 Languages", desc: "Including full RTL for Arabic & Urdu." },
            { icon: ShieldCheck, title: "Secure Cloud", desc: "Per-user data, row-level security, admin roles." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl card-elevated p-6">
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
