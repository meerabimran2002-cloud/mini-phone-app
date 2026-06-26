import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, CheckSquare, Bell, CloudSun, Calculator, Settings, Shield, LogOut, Sparkles, Menu,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const { session, loading, isAdmin } = useAuth();
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/tasks", icon: CheckSquare, label: t("tasks") },
    { to: "/alarms", icon: Bell, label: t("alarms") },
    { to: "/weather", icon: CloudSun, label: t("weather") },
    { to: "/calculator", icon: Calculator, label: t("calculator") },
    { to: "/settings", icon: Settings, label: t("settings") },
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: t("admin") }] : []),
  ];

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-20" style={{ background: "var(--gradient-hero)", filter: "blur(100px)" }} />
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card/80 backdrop-blur-xl transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">Nimbus</span>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button onClick={signOut} className="absolute bottom-4 left-3 right-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" /> {t("signOut")}
        </button>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-8">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-accent lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs text-muted-foreground">{session.user.email}</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
              {(session.user.email ?? "?").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
