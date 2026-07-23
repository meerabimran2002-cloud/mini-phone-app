import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Personal App" },
      { name: "description", content: "Your personal productivity workspace: tasks, alarms, weather, photos and more." },
      { property: "og:title", content: "Personal App" },
      { property: "og:description", content: "Your personal productivity workspace: tasks, alarms, weather, photos and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
