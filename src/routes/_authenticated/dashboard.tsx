import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Bell, CloudSun, Calculator, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Personal App" },
      { name: "description", content: "Your Personal App dashboard with today's tasks and upcoming alarms." },
      { property: "og:title", content: "Dashboard — Personal App" },
      { property: "og:description", content: "See your tasks, alarms and daily workspace summary in Personal App." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("todos")
        .select("*")
        .eq("completed", false)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: alarms = [] } = useQuery({
    queryKey: ["alarms-upcoming", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("alarms").select("*").eq("enabled", true).order("time").limit(5);
      return data ?? [];
    },
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const name = profile?.display_name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {greeting}, <span className="text-gradient">{name}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's your day at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CheckSquare} label={t("tasks")} value={tasks.length.toString()} to="/tasks" />
        <StatCard icon={Bell} label={t("alarms")} value={alarms.length.toString()} to="/alarms" />
        <StatCard icon={CloudSun} label={t("weather")} value="Live" to="/weather" />
        <StatCard icon={Calculator} label={t("calculator")} value="Open" to="/calculator" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl card-elevated p-6">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("todayTasks")}</h2>
            <Link to="/tasks" className="text-xs font-medium text-primary hover:underline">View all →</Link>
          </header>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noTasks")}</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task: any) => (
                <li key={task.id} className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5">
                  <span className={`h-2 w-2 rounded-full ${task.priority === "high" ? "bg-destructive" : task.priority === "medium" ? "bg-primary" : "bg-muted-foreground"}`} />
                  <span className="flex-1 truncate text-sm">{task.title}</span>
                  {task.due_date && <span className="text-xs text-muted-foreground">{new Date(task.due_date).toLocaleDateString()}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl card-elevated p-6">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("upcomingAlarms")}</h2>
            <Link to="/alarms" className="text-xs font-medium text-primary hover:underline">View all →</Link>
          </header>
          {alarms.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noAlarms")}</p>
          ) : (
            <ul className="space-y-2">
              {alarms.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium">{a.label}</div>
                    <div className="text-xs text-muted-foreground">{a.time}</div>
                  </div>
                  <Bell className="h-4 w-4 text-primary" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to }: { icon: any; label: string; value: string; to: string }) {
  return (
    <Link to={to} className="group rounded-2xl card-elevated p-5 transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
      </div>
      <div className="mt-4 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Link>
  );
}
