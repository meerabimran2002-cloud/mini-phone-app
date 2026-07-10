import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bell, Play, Plus, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/alarms")({
  component: AlarmsPage,
});

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Ringtone patterns played via Web Audio — no assets needed.
type Ringtone = { id: string; label: string; notes: number[]; interval: number; type: OscillatorType };
const RINGTONES: Ringtone[] = [
  { id: "chime",    label: "Chime",    notes: [880, 1046, 1318],       interval: 260, type: "sine" },
  { id: "bell",     label: "Bell",     notes: [1568, 1318, 1046, 784], interval: 200, type: "triangle" },
  { id: "beep",     label: "Classic",  notes: [880, 880],              interval: 220, type: "square" },
  { id: "digital",  label: "Digital",  notes: [1200, 900, 1200, 900],  interval: 140, type: "sawtooth" },
  { id: "morning",  label: "Morning",  notes: [523, 659, 784, 1046],   interval: 240, type: "sine" },
  { id: "buzz",     label: "Buzzer",   notes: [220, 180, 220, 180],    interval: 180, type: "square" },
];

class RingPlayer {
  ctx: AudioContext | null = null;
  timers: number[] = [];
  playing = false;
  play(id: string, durationMs = 8000) {
    this.stop();
    const rt = RINGTONES.find((r) => r.id === id) ?? RINGTONES[0];
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    this.ctx = new AC();
    this.playing = true;
    const start = this.ctx.currentTime;
    const perCycle = rt.notes.length * rt.interval;
    const cycles = Math.max(1, Math.ceil(durationMs / perCycle));
    for (let c = 0; c < cycles; c++) {
      rt.notes.forEach((freq, i) => {
        const t0 = start + (c * perCycle + i * rt.interval) / 1000;
        const t1 = t0 + rt.interval / 1000 - 0.02;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = rt.type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t1);
        osc.connect(gain); gain.connect(this.ctx!.destination);
        osc.start(t0); osc.stop(t1 + 0.05);
      });
    }
    this.timers.push(window.setTimeout(() => this.stop(), durationMs + 200));
  }
  stop() {
    this.timers.forEach(clearTimeout); this.timers = [];
    if (this.ctx) { try { this.ctx.close(); } catch {} this.ctx = null; }
    this.playing = false;
  }
}

const player = new RingPlayer();

function nextTrigger(time: string, repeatDays: number[]): number {
  const [h, m] = time.split(":").map(Number);
  const now = new Date();
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, h, m, 0, 0);
    if (d.getTime() <= now.getTime()) continue;
    if (repeatDays.length === 0) return d.getTime();
    if (repeatDays.includes(d.getDay())) return d.getTime();
  }
  return Number.POSITIVE_INFINITY;
}

function AlarmsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState<number[]>([]);
  const [ringtone, setRingtone] = useState<string>("chime");
  const [ringingId, setRingingId] = useState<string | null>(null);
  const timersRef = useRef<Record<string, number>>({});

  const { data: alarms = [] } = useQuery({
    queryKey: ["alarms", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("alarms").select("*").order("time");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  // Precise scheduling: setTimeout per enabled alarm to its next trigger.
  useEffect(() => {
    Object.values(timersRef.current).forEach((id) => clearTimeout(id));
    timersRef.current = {};

    alarms.forEach((a: any) => {
      if (!a.enabled) return;
      const when = nextTrigger(a.time, a.repeat_days ?? []);
      const delay = when - Date.now();
      if (!isFinite(delay) || delay < 0 || delay > 24 * 60 * 60 * 1000) return;
      const id = window.setTimeout(() => {
        setRingingId(a.id);
        player.play(a.ringtone ?? "chime", 15000);
        toast(`⏰ ${a.label}`, { duration: 15000, description: `It's ${a.time}` });
        if ("Notification" in window && Notification.permission === "granted") {
          try { new Notification("Alarm — " + a.label, { body: `It's ${a.time}` }); } catch {}
        }
        // Reschedule after firing
        qc.invalidateQueries({ queryKey: ["alarms"] });
      }, delay);
      timersRef.current[a.id] = id;
    });

    return () => Object.values(timersRef.current).forEach((id) => clearTimeout(id));
  }, [alarms, qc]);

  const add = useMutation({
    mutationFn: async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const { error } = await supabase.from("alarms").insert({
        user_id: user!.id, label: label || "Alarm", time, repeat_days: days, ringtone, timezone: tz,
      });
      if (error) throw error;
    },
    onSuccess: () => { setLabel(""); setDays([]); qc.invalidateQueries({ queryKey: ["alarms"] }); toast.success("Alarm added"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const toggle = useMutation({
    mutationFn: async (a: any) => { const { error } = await supabase.from("alarms").update({ enabled: !a.enabled }).eq("id", a.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarms"] }),
  });

  const changeRingtone = useMutation({
    mutationFn: async ({ id, r }: { id: string; r: string }) => { const { error } = await supabase.from("alarms").update({ ringtone: r }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarms"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("alarms").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarms"] }),
  });

  const toggleDay = (d: number) => setDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);

  const stopRinging = () => { player.stop(); setRingingId(null); };

  const [pushState, setPushState] = useState<"idle" | "enabling" | "on" | "off">("idle");
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) { setPushState("off"); return; }
    if (Notification.permission === "granted") {
      navigator.serviceWorker.getRegistration().then((reg) =>
        reg?.pushManager.getSubscription().then((s) => setPushState(s ? "on" : "off")),
      );
    } else setPushState("off");
  }, []);

  const enablePush = async () => {
    setPushState("enabling");
    const { enablePushForCurrentUser, registerServiceWorker } = await import("@/lib/push");
    await registerServiceWorker();
    const res = await enablePushForCurrentUser();
    if (res.ok) { toast.success("Background alarms enabled 🔔"); setPushState("on"); }
    else { toast.error(res.reason || "Could not enable notifications"); setPushState("off"); }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("alarms")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Rings on time — even when the app is closed, once notifications are on.</p>
        </div>
        <div className="flex items-center gap-2">
          {pushState !== "on" && (
            <button onClick={enablePush} disabled={pushState === "enabling"} className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-lg disabled:opacity-50">
              <Bell className="h-3.5 w-3.5" /> {pushState === "enabling" ? "Enabling…" : "Enable background alarms"}
            </button>
          )}
          {pushState === "on" && (
            <span className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">🔔 Background on</span>
          )}
          {ringingId && (
            <button onClick={stopRinging} className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-lg animate-pulse">
              <Square className="h-4 w-4" /> Stop
            </button>
          )}
        </div>
      </header>


      <div className="rounded-2xl card-elevated p-4 sm:p-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Morning workout)" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 text-sm tabular-nums" />
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("ringtone")}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {RINGTONES.map((r) => (
              <div key={r.id} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition ${ringtone === r.id ? "border-primary bg-primary/10" : "border-border"}`}>
                <button onClick={() => setRingtone(r.id)} className="flex-1 text-left font-medium">{r.label}</button>
                <button onClick={() => player.play(r.id, 1500)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={`Preview ${r.label}`}>
                  <Play className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-2">Repeat</span>
          {DAYS.map((d, i) => (
            <button key={i} onClick={() => toggleDay(i)} className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition ${days.includes(i) ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary"}`}>{d}</button>
          ))}
          {days.length === 0 && <span className="text-xs text-muted-foreground">One-time</span>}
        </div>

        <button onClick={() => add.mutate()} disabled={add.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
          <Plus className="h-4 w-4" /> {t("addAlarm")}
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {alarms.length === 0 && <li className="col-span-full rounded-2xl card-elevated p-8 text-center text-sm text-muted-foreground">{t("noAlarms")}</li>}
        {alarms.map((a: any) => (
          <li key={a.id} className={`flex flex-col gap-3 rounded-2xl card-elevated p-5 transition ${ringingId === a.id ? "ring-2 ring-primary animate-pulse" : ""}`}>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
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
            </div>
            <div className="flex items-center gap-2">
              <select
                value={a.ringtone ?? "chime"}
                onChange={(e) => changeRingtone.mutate({ id: a.id, r: e.target.value })}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
              >
                {RINGTONES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <button onClick={() => player.play(a.ringtone ?? "chime", 1500)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                <Play className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
