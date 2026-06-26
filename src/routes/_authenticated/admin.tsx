import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Shield, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const filtered = profiles.filter((p: any) =>
    !search || p.display_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const since30 = profiles.filter((p: any) => new Date(p.created_at).getTime() > Date.now() - 30 * 86400_000).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">{t("admin")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage users and view analytics.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card icon={Users} label="Total users" value={profiles.length} />
        <Card icon={Activity} label="New (30d)" value={since30} />
        <Card icon={Shield} label="You are" value="Admin" />
      </div>

      <div className="rounded-2xl card-elevated p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Users</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="rounded-xl border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2">Name</th><th>Email</th><th>Joined</th><th>Theme</th><th>Lang</th></tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-t border-border/50">
                  <td className="py-3 font-medium">{p.display_name ?? "—"}</td>
                  <td className="text-muted-foreground">{p.email ?? "—"}</td>
                  <td className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="text-muted-foreground">{p.theme}</td>
                  <td className="text-muted-foreground uppercase">{p.language}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        To grant admin role: in Cloud → SQL editor, run <code className="rounded bg-muted px-1.5 py-0.5">INSERT INTO user_roles (user_id, role) VALUES ('user-uuid', 'admin');</code>
      </p>
    </div>
  );
}

function Card({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="rounded-2xl card-elevated p-6">
      <div className="grid h-10 w-10 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
