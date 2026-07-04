import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/photos")({
  component: PhotosPage,
});

function PhotosPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["photos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("photos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const withUrls = await Promise.all(
        (data ?? []).map(async (p: any) => {
          const { data: signed } = await supabase.storage.from("photos").createSignedUrl(p.storage_path, 3600);
          return { ...p, url: signed?.signedUrl };
        }),
      );
      return withUrls;
    },
  });

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("photos").insert({
        user_id: user.id, storage_path: path, caption: caption.trim() || null,
      });
      if (insErr) throw insErr;
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["photos"] });
      toast.success("Photo added");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const del = useMutation({
    mutationFn: async (p: any) => {
      await supabase.storage.from("photos").remove([p.storage_path]);
      const { error } = await supabase.from("photos").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">{t("photos")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Save your favorite pictures — private to your account.</p>
      </header>

      <div className="rounded-2xl card-elevated p-4 sm:p-5 space-y-3">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Add picture"}
        </button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : photos.length === 0 ? (
        <div className="rounded-2xl card-elevated p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No pictures yet. Tap “Add picture” to upload your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p: any) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-2xl card-elevated">
              {p.url && <img src={p.url} alt={p.caption ?? "photo"} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />}
              {p.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs font-medium text-white">
                  {p.caption}
                </div>
              )}
              <button
                onClick={() => del.mutate(p)}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur transition hover:bg-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
