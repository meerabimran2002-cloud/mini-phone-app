# Personal App — Project Setup & Troubleshooting Guide

This is a TanStack Start + Lovable Cloud project. Use this guide whenever login/signup stops working or you set up the project on a new machine.

---

## 1. First-time local setup

1. **Clone / open the project** in the Lovable editor or your local IDE.
2. **Install dependencies** (already done inside Lovable, but run if needed):
   ```bash
   bun install
   ```
3. **Environment variables** are already configured in `.env`. Do not change these unless you are moving to a new backend.
4. **Start the dev server**:
   ```bash
   bun run dev
   ```
   The app will open at `http://localhost:8080`.
5. **Sign in or sign up** at `/auth` with email and password.

---

## 2. How to unpause the backend when login/signup fails

If sign-in or sign-up suddenly fails with a generic error, the most common cause is that the **Lovable Cloud backend is paused**. Follow these steps to wake it up.

### Step 1 — Open the backend panel
- Click **View Backend** in the Lovable editor, or
- Go to your project settings and open the **Cloud / Backend** section.

### Step 2 — Check the backend status
Look for the status badge. If it says **Paused**, **Inactive**, or **Sleeping**, the database and auth services are turned off.

### Step 3 — Resume the backend
- Click the **Resume**, **Unpause**, or **Wake up** button.
- Wait until the status changes to **Active / Healthy**. This usually takes 30–60 seconds.

### Step 4 — Refresh the app
- Go back to the app preview (`/auth`).
- Refresh the page.
- Try signing in or signing up again.

### Step 5 — If it still fails
- Open the browser console (F12 → Console).
- Look for a red error message and copy it.
- Share that exact error message to find out whether it is a backend, RLS, or code issue.

> **Tip:** Lovable Cloud pauses automatically after a period of inactivity. When login/signup stops working, always check the backend status first before changing code.

---

## 3. Admin login

- **Email:** `meerab.imran.2002@gmail.com`
- **Password:** `06042006`

After signing in, the **Admin Portal** link appears in the sidebar/header only for users with the `admin` role.

---

## 4. Useful commands

```bash
# Run the dev server
bun run dev

# Type-check the project
bunx tsc --noEmit

# Build for production
bun run build
```

---

## 5. What to do next if problems continue

If the backend is active and login/signup still fails:

1. Check the browser console for the exact error.
2. Check the Network tab for any failed request to `supabase.co`.
3. Make sure the `.env` values have not been overwritten.
4. Ask for help and share the exact error text.
