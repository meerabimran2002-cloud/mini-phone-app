import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

type Filter = "all" | "active" | "completed";

function TasksPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("general");
  const [due, setDue] = useState("");

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("todos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title required");
      const { error } = await supabase.from("todos").insert({
        user_id: user!.id, title: title.trim(), priority, category,
        due_date: due ? new Date(due).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { setTitle(""); setDue(""); qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["tasks-today"] }); toast.success("Task added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (task: any) => {
      const { error } = await supabase.from("todos").update({ completed: !task.completed }).eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["tasks-today"] }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["tasks-today"] }); toast.success("Deleted"); },
  });

  const filtered = tasks.filter((task: any) => {
    if (filter === "active" && task.completed) return false;
    if (filter === "completed" && !task.completed) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">{t("tasks")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Plan, prioritize and ship your day.</p>
      </header>

      <div className="rounded-2xl card-elevated p-5">
        <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("addTask")} className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
            <option value="low">{t("low")}</option><option value="medium">{t("medium")}</option><option value="high">{t("high")}</option>
          </select>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm w-32" />
          <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          <button type="submit" disabled={add.isPending} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Plus className="h-4 w-4" /> {t("add")}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t(f)}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {filtered.length === 0 && <li className="rounded-2xl card-elevated p-8 text-center text-sm text-muted-foreground">{t("noTasks")}</li>}
        {filtered.map((task: any) => (
          <li key={task.id} className="group flex items-center gap-3 rounded-2xl card-elevated p-4 transition hover:-translate-y-0.5">
            <button onClick={() => toggle.mutate(task)} className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition ${task.completed ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
              {task.completed && <Check className="h-3.5 w-3.5" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-sm font-medium ${task.completed ? "text-muted-foreground line-through" : ""}`}>{task.title}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className={`rounded-full px-2 py-0.5 ${task.priority === "high" ? "bg-destructive/10 text-destructive" : task.priority === "medium" ? "bg-primary/10 text-primary" : "bg-muted"}`}>{t(task.priority)}</span>
                <span>· {task.category}</span>
                {task.due_date && <span>· {new Date(task.due_date).toLocaleString()}</span>}
              </div>
            </div>
            <button onClick={() => del.mutate(task.id)} className="rounded-lg p-2 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
