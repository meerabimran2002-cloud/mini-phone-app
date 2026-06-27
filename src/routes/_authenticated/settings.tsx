import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Upload, User as UserIcon, Loader2 } from "lucide-react";
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
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, bio, avatar_url").eq("id", user.id).maybeSingle().then(async ({ data }) => {
      setDisplayName(data?.display_name ?? "");
      setBio(data?.bio ?? "");
      const path = data?.avatar_url ?? null;
      setAvatarPath(path);
      if (path) {
        if (path.startsWith("http")) {
          setAvatarUrl(path);
        } else {
          const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
          setAvatarUrl(signed?.signedUrl ?? null);
        }
      }
    });
  }, [user]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      if (avatarPath && !avatarPath.startsWith("http")) {
        await supabase.storage.from("avatars").remove([avatarPath]);
      }
      setAvatarPath(path);
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      setAvatarUrl(signed?.signedUrl ?? null);
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      toast.success("Profile picture updated");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, display_name: displayName, bio, theme, language: lang, email: user.email,
      ...(avatarPath ? { avatar_url: avatarPath } : {}),
    });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-24">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t("settings")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalize your workspace.</p>
      </header>

      <section className="rounded-2xl card-elevated p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("profile")}</h2>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="relative">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-background shadow-xl ring-2 ring-primary/30 bg-muted">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-110 active:scale-95 disabled:opacity-50"
              aria-label="Upload picture"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="grid w-full gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("name")}</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("email")}</label>
              <input value={user?.email ?? ""} disabled className="w-full rounded-xl border border-input bg-muted px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 280))}
                rows={3}
                placeholder="Tell people a little about you…"
                className="w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="mt-1 text-right text-[11px] text-muted-foreground">{bio.length}/280</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl card-elevated p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("theme")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((th) => (
            <button key={th.id} onClick={() => setTheme(th.id as ThemeId)} className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 sm:p-4 transition active:scale-95 ${theme === th.id ? "border-primary" : "border-border hover:border-primary/50"}`}>
              <div className="h-10 sm:h-12 w-full rounded-lg" style={{ background: th.swatch }} />
              <span className="text-xs font-medium">{th.name}</span>
              {theme === th.id && <div className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></div>}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl card-elevated p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("language")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {LANGUAGES.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code as LangCode)} className={`rounded-xl border p-3 text-sm font-medium transition active:scale-95 ${lang === l.code ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
              {l.name}
            </button>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button onClick={save} disabled={saving} className="w-full sm:w-auto rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving…" : t("save")}
        </button>
      </div>
    </div>
  );
}
