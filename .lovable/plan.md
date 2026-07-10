## Goal
Alarms ring on time even when the website/tab is closed, tasks add reliably, and the app works offline. Then wrap up.

## 1. Background alarms (ring even if site is closed)

Browsers don't run JS timers when a tab is closed, so we need **Web Push notifications** triggered by a server cron. Flow:

1. Generate VAPID keys (stored as secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
2. Add a service worker (`public/sw.js`) that:
   - Handles `push` events → shows notification with alarm label + plays sound page on click.
   - Handles `notificationclick` → opens the app.
3. On login, register the SW, ask notification permission, subscribe to push, and save the subscription in a new `push_subscriptions` table (user_id, endpoint, p256dh, auth).
4. New TanStack server route `/api/public/hooks/check-alarms` (POST):
   - Uses service role to query enabled alarms whose next trigger is within the last minute.
   - Sends web push to that user's subscriptions using `web-push` npm package.
   - For one-time alarms (no repeat_days), auto-disable after firing.
5. `pg_cron` job every minute calls that endpoint with the anon apikey header.

## 2. Tasks add reliably

Current issue was RLS/grants (already fixed last turn). Add clearer error surfacing + guard: if insert fails, show exact DB message; also trim/validate title client-side. Small polish only.

## 3. Offline support (PWA)

Use `vite-plugin-pwa` (per PWA skill) with `registerType: "autoUpdate"`, `NetworkFirst` for HTML, `CacheFirst` for hashed assets. Guarded registration wrapper that:
- Skips in dev / Lovable preview / iframe.
- Supports `?sw=off` kill switch.
- Only registers in production.

Add manifest with name "Personal App", theme color, icons, `display: "standalone"` so users can install it to home screen.

Note: offline works for the app shell + cached data. Live DB writes still need internet — they'll queue via TanStack Query retry.

## Technical details

**New files:**
- `public/sw.js` — push + notificationclick handlers (hand-written for push; vite-plugin-pwa handles offline SW separately at `/pwa-sw.js` to avoid conflict).
- `public/manifest.webmanifest` + icons.
- `src/lib/push.ts` — subscribe/unsubscribe helpers.
- `src/lib/register-sw.ts` — guarded registration wrapper.
- `src/routes/api/public/hooks/check-alarms.ts` — cron endpoint.
- `src/lib/web-push.server.ts` — VAPID send helper.

**DB migration:**
- `push_subscriptions` table (user_id, endpoint unique, p256dh, auth, created_at) with RLS + grants.

**Secrets to add:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto:you@example.com). I'll generate them.

**Cron:** `select cron.schedule('check-alarms', '* * * * *', $$ ... net.http_post(...) $$)` — every minute.

**Caveats to tell the user:**
- iOS: push notifications only work if the user **installs** the app to home screen (iOS 16.4+).
- Ringtone sound: notifications play the OS default sound; custom Web Audio ringtones only play when the app is open. For closed-app custom sound we'd need a native app.
- User must grant notification permission once.

## Out of scope
No changes to admin portal, weather, calculator, photos, or auth flow.
