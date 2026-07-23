import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MapPin, Search, Wind, Droplets, Thermometer } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/weather")({
  head: () => ({
    meta: [
      { title: "Weather — Personal App" },
      { name: "description", content: "Check live local weather and a seven-day forecast in Personal App." },
      { property: "og:title", content: "Weather — Personal App" },
      { property: "og:description", content: "Search city weather and forecasts inside Personal App." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WeatherPage,
});

const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" }, 1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" }, 3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" }, 48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" }, 53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌧️" }, 63: { label: "Rain", icon: "🌧️" }, 65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" }, 73: { label: "Snow", icon: "🌨️" }, 75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Showers", icon: "🌦️" }, 81: { label: "Heavy showers", icon: "🌧️" },
  95: { label: "Thunderstorm", icon: "⛈️" }, 96: { label: "Storm + hail", icon: "⛈️" },
};

function WeatherPage() {
  const { t } = useI18n();
  const [coords, setCoords] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude, name: "Your location" }),
      () => setCoords({ lat: 40.7128, lon: -74.006, name: "New York" }),
      { timeout: 5000 },
    );
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["weather", coords?.lat, coords?.lon],
    enabled: !!coords,
    queryFn: async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords!.lat}&longitude=${coords!.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      return res.json();
    },
  });

  const searchCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=1`);
    const j = await res.json();
    const r = j.results?.[0];
    if (r) setCoords({ lat: r.latitude, lon: r.longitude, name: `${r.name}, ${r.country_code}` });
  };

  const cur = data?.current;
  const code = cur?.weather_code as number | undefined;
  const w = code !== undefined ? WMO[code] ?? { label: "—", icon: "🌡️" } : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("weather")}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {coords?.name ?? "Locating…"}</p>
        </div>
        <form onSubmit={searchCity} className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search city…" className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm" />
        </form>
      </header>

      <section className="rounded-3xl p-8 text-white shadow-2xl" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}>
        {isLoading || !cur ? <div className="text-white/80">Loading…</div> : (
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-7xl font-extrabold tabular-nums">{Math.round(cur.temperature_2m)}°</div>
              <div className="mt-2 text-lg text-white/90">{w?.label}</div>
            </div>
            <div className="text-8xl">{w?.icon}</div>
            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-sm">
              <Stat icon={Thermometer} label="Feels" value={`${Math.round(cur.temperature_2m)}°`} />
              <Stat icon={Droplets} label="Humidity" value={`${cur.relative_humidity_2m}%`} />
              <Stat icon={Wind} label="Wind" value={`${Math.round(cur.wind_speed_10m)} km/h`} />
            </div>
          </div>
        )}
      </section>

      {data?.daily && (
        <section className="rounded-2xl card-elevated p-6">
          <h2 className="mb-4 text-lg font-semibold">7-day forecast</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {data.daily.time.map((day: string, i: number) => {
              const dw = WMO[data.daily.weather_code[i]] ?? { icon: "🌡️", label: "" };
              return (
                <div key={day} className="rounded-xl border border-border/50 bg-background/50 p-3 text-center">
                  <div className="text-xs text-muted-foreground">{new Date(day).toLocaleDateString(undefined, { weekday: "short" })}</div>
                  <div className="my-2 text-3xl">{dw.icon}</div>
                  <div className="text-sm font-semibold">{Math.round(data.daily.temperature_2m_max[i])}°</div>
                  <div className="text-xs text-muted-foreground">{Math.round(data.daily.temperature_2m_min[i])}°</div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-white/70" />
      <div>
        <div className="text-xs text-white/70">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
