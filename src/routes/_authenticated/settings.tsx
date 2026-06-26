import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LANGUAGES, type LangCode } from "@/lib/i18n";
import { useTheme, THEMES, type ThemeId } from "@/lib/theme-provider";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, display_name: displayName, theme, language: lang, email: user.email,
    });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">{t("settings")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalize your workspace.</p>
      </header>

      <section className="rounded-2xl card-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("profile")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("name")}</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("email")}</label>
            <input value={user?.email ?? ""} disabled className="w-full rounded-xl border border-input bg-muted px-4 py-2.5 text-sm" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl card-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("theme")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((th) => (
            <button key={th.id} onClick={() => setTheme(th.id as ThemeId)} className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${theme === th.id ? "border-primary" : "border-border hover:border-primary/50"}`}>
              <div className="h-12 w-full rounded-lg" style={{ background: th.swatch }} />
              <span className="text-xs font-medium">{th.name}</span>
              {theme === th.id && <div className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></div>}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl card-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("language")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code as LangCode)} className={`rounded-xl border p-3 text-sm font-medium transition ${lang === l.code ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
              {l.name}
            </button>
          ))}
        </div>
      </section>

      <button onClick={save} disabled={saving} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 disabled:opacity-50">
        {saving ? "Saving…" : t("save")}
      </button>
    </div>
  );
}
