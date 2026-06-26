import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/alarms")({
  component: AlarmsPage,
});

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function AlarmsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState<number[]>([]);
  const fired = useRef<Set<string>>(new Set());

  const { data: alarms = [] } = useQuery({
    queryKey: ["alarms", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("alarms").select("*").order("time");
      if (error) throw error;
      return data;
    },
  });

  // Browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  // Check alarms every 30s
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const key = `${now.toDateString()}-${hm}`;
      alarms.forEach((a: any) => {
        if (!a.enabled || a.time !== hm) return;
        const id = `${a.id}-${key}`;
        if (fired.current.has(id)) return;
        if (a.repeat_days?.length && !a.repeat_days.includes(now.getDay())) return;
        fired.current.add(id);
        toast(`⏰ ${a.label}`, { duration: 8000 });
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Alarm", { body: a.label });
        }
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880; gain.gain.value = 0.1;
          osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 800);
        } catch {}
      });
    };
    check();
    const i = setInterval(check, 30_000);
    return () => clearInterval(i);
  }, [alarms]);

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("alarms").insert({
        user_id: user!.id, label: label || "Alarm", time, repeat_days: days,
      });
      if (error) throw error;
    },
    onSuccess: () => { setLabel(""); setDays([]); qc.invalidateQueries({ queryKey: ["alarms"] }); qc.invalidateQueries({ queryKey: ["alarms-upcoming"] }); toast.success("Alarm added"); },
  });

  const toggle = useMutation({
    mutationFn: async (a: any) => { await supabase.from("alarms").update({ enabled: !a.enabled }).eq("id", a.id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarms"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("alarms").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alarms"] }); qc.invalidateQueries({ queryKey: ["alarms-upcoming"] }); },
  });

  const toggleDay = (d: number) => setDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">{t("alarms")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Stay on time. Alarms ring while this tab is open.</p>
      </header>

      <div className="rounded-2xl card-elevated p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Morning workout)" className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">Repeat:</span>
          {DAYS.map((d, i) => (
            <button key={i} onClick={() => toggleDay(i)} className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition ${days.includes(i) ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary"}`}>{d}</button>
          ))}
        </div>
        <button onClick={() => add.mutate()} disabled={add.isPending} className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> {t("addAlarm")}
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {alarms.length === 0 && <li className="col-span-full rounded-2xl card-elevated p-8 text-center text-sm text-muted-foreground">{t("noAlarms")}</li>}
        {alarms.map((a: any) => (
          <li key={a.id} className="flex items-center gap-4 rounded-2xl card-elevated p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
              <Bell className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-bold tabular-nums">{a.time}</div>
              <div className="truncate text-sm text-muted-foreground">{a.label}</div>
              {a.repeat_days?.length > 0 && (
                <div className="mt-1 flex gap-1">
                  {DAYS.map((d, i) => (
                    <span key={i} className={`text-[10px] font-bold ${a.repeat_days.includes(i) ? "text-primary" : "text-muted-foreground/40"}`}>{d}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={a.enabled} onChange={() => toggle.mutate(a)} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary transition" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
              </label>
              <button onClick={() => del.mutate(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
