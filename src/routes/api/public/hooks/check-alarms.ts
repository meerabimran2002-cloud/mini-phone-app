import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/check-alarms")({
  server: {
    handlers: {
      POST: async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const webpush = (await import("web-push")).default;

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY!;
        const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
        const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

        const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const now = new Date();
        const { data: alarms, error } = await admin
          .from("alarms")
          .select("id,user_id,label,time,repeat_days,enabled,last_fired_at,timezone")
          .eq("enabled", true);
        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        // Compute wall-clock hour/minute/weekday in a given IANA timezone.
        function tzParts(tz: string) {
          try {
            const fmt = new Intl.DateTimeFormat("en-US", {
              timeZone: tz || "UTC",
              hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false,
            });
            const parts = fmt.formatToParts(now);
            const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
            const hour = parseInt(get("hour"), 10) % 24;
            const minute = parseInt(get("minute"), 10);
            const wk = get("weekday");
            const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
            return { hour, minute, day: map[wk] ?? now.getUTCDay() };
          } catch {
            return { hour: now.getUTCHours(), minute: now.getUTCMinutes(), day: now.getUTCDay() };
          }
        }

        const results: Array<{ id: string; sent: number; removed: number }> = [];
        for (const a of alarms || []) {
          const [h, m] = String(a.time).split(":").map(Number);
          const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
          const alarmMin = h * 60 + m;
          if (nowMin !== alarmMin) continue;

          // Repeat-days filter (0=Sun..6=Sat, UTC)
          const days: number[] = a.repeat_days || [];
          if (days.length > 0 && !days.includes(now.getUTCDay())) continue;

          // Debounce: don't fire twice in same minute
          if (a.last_fired_at) {
            const last = new Date(a.last_fired_at);
            if (Math.floor(last.getTime() / 60000) === Math.floor(now.getTime() / 60000)) continue;
          }

          const { data: subs } = await admin
            .from("push_subscriptions")
            .select("id,endpoint,p256dh,auth")
            .eq("user_id", a.user_id);

          const payload = JSON.stringify({
            title: `⏰ ${a.label || "Alarm"}`,
            body: `It's ${a.time}`,
            tag: `alarm-${a.id}`,
            url: "/alarms",
          });

          let sent = 0;
          let removed = 0;
          for (const s of subs || []) {
            try {
              await webpush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                payload,
                { TTL: 60 },
              );
              sent++;
            } catch (err: any) {
              const code = err?.statusCode;
              if (code === 404 || code === 410) {
                await admin.from("push_subscriptions").delete().eq("id", s.id);
                removed++;
              } else {
                console.error("push error", code, err?.body);
              }
            }
          }

          // Mark fired + disable one-time alarms
          const updates: Record<string, unknown> = { last_fired_at: now.toISOString() };
          if (days.length === 0) updates.enabled = false;
          await admin.from("alarms").update(updates).eq("id", a.id);

          results.push({ id: a.id, sent, removed });
        }

        return Response.json({ ok: true, checked: alarms?.length || 0, fired: results });
      },
    },
  },
});
