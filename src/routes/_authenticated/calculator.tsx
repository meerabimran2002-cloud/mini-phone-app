import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/calculator")({
  component: CalcPage,
});

function CalcPage() {
  const { t } = useI18n();
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [sci, setSci] = useState(false);

  const evalExpr = (s: string): string => {
    try {
      const safe = s
        .replace(/π/g, "Math.PI")
        .replace(/e(?![a-zA-Z])/g, "Math.E")
        .replace(/√\(/g, "Math.sqrt(")
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/\^/g, "**")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-");
      if (!/^[0-9+\-*/().,\s*MathPIEsqrtincoglae]*$/.test(safe)) return "Err";
      // eslint-disable-next-line no-new-func
      const v = Function(`"use strict"; return (${safe})`)();
      return Number.isFinite(v) ? String(+v.toPrecision(12)) : "Err";
    } catch { return "Err"; }
  };

  const push = (s: string) => setExpr((p) => p + s);
  const equals = () => {
    const r = evalExpr(expr);
    setResult(r);
    if (r !== "Err") setHistory((h) => [{ expr, result: r }, ...h].slice(0, 10));
  };

  const basic = ["7","8","9","÷","4","5","6","×","1","2","3","−","0",".","%","+"];
  const scientific = ["sin(","cos(","tan(","π","√(","^","ln(","log(","(",")","e","!"];

  const Btn = ({ v, accent, span = 1 }: { v: string; accent?: "op" | "eq" | "ac"; span?: number }) => (
    <button
      onClick={() => v === "=" ? equals() : v === "AC" ? (setExpr(""), setResult("")) : v === "⌫" ? setExpr((p) => p.slice(0, -1)) : push(v)}
      className={`rounded-2xl py-4 text-lg font-semibold transition active:scale-95 ${
        accent === "eq" ? "bg-primary text-primary-foreground shadow-lg" :
        accent === "op" ? "bg-accent text-accent-foreground hover:bg-accent/80" :
        accent === "ac" ? "bg-destructive/10 text-destructive hover:bg-destructive/20" :
        "bg-card hover:bg-accent"
      } ${span === 2 ? "col-span-2" : ""}`}
    >{v}</button>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("calculator")}</h1>
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          <button onClick={() => setSci(false)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!sci ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Basic</button>
          <button onClick={() => setSci(true)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${sci ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Scientific</button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl card-elevated p-6">
          <div className="min-h-[120px] rounded-2xl bg-background/60 p-5 text-right">
            <div className="overflow-x-auto break-all text-xl text-muted-foreground">{expr || "0"}</div>
            <div className="mt-2 text-4xl font-bold tabular-nums">{result || "—"}</div>
          </div>

          {sci && (
            <div className="mt-4 grid grid-cols-6 gap-2">
              {scientific.map((b) => <Btn key={b} v={b} accent="op" />)}
            </div>
          )}

          <div className="mt-4 grid grid-cols-4 gap-2">
            <Btn v="AC" accent="ac" />
            <Btn v="⌫" accent="op" />
            <Btn v="(" accent="op" />
            <Btn v=")" accent="op" />
            {basic.map((b) => <Btn key={b} v={b} accent={["÷","×","−","+","%"].includes(b) ? "op" : undefined} />)}
            <Btn v="=" accent="eq" span={4} />
          </div>
        </div>

        <aside className="rounded-3xl card-elevated p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your calculations appear here.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h, i) => (
                <li key={i} onClick={() => setExpr(h.expr)} className="cursor-pointer rounded-lg border border-border/50 p-3 hover:bg-accent">
                  <div className="truncate text-xs text-muted-foreground">{h.expr}</div>
                  <div className="text-lg font-semibold tabular-nums">= {h.result}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
