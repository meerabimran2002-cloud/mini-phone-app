import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Personal App" },
      { name: "description", content: "Sign in or create an account for your private Personal App workspace." },
      { property: "og:title", content: "Sign in — Personal App" },
      { property: "og:description", content: "Access your tasks, alarms, photos, weather and calculator in Personal App." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { t } = useI18n();
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [session, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created! You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-blob absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-30" style={{ background: "var(--gradient-hero)", filter: "blur(100px)" }} />
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">Personal App</span>
        </Link>

        <div className="rounded-3xl card-elevated p-5 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold">{isSignUp ? t("signUp") : t("welcomeBack")}</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {isSignUp ? "Create your account in seconds." : "Sign in to continue to your workspace."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3 sm:space-y-4">
            {isSignUp && (
              <input type="text" placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base sm:text-sm outline-none focus:ring-2 focus:ring-ring" />
            )}
            <input type="email" inputMode="email" autoComplete="email" placeholder={t("email")} required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base sm:text-sm outline-none focus:ring-2 focus:ring-ring" />
            <input type="password" autoComplete={isSignUp ? "new-password" : "current-password"} placeholder={t("password")} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base sm:text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50" style={{ boxShadow: "var(--shadow-glow)" }}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignUp ? t("signUp") : t("signIn")}
            </button>
          </form>

          <button onClick={() => setIsSignUp(!isSignUp)} className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground">
            {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
