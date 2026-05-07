import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "./api";

function StatusPill({ status }) {
  const map = {
    Received: "bg-emerald-100 text-emerald-700 border-emerald-200",
    "In Review": "bg-amber-100 text-amber-700 border-amber-200",
    Accepted: "bg-violet-100 text-violet-700 border-violet-200",
    Completed: "bg-sky-100 text-sky-700 border-sky-200",
    Rejected: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const cls = map[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

function fmtDT(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function computeRiskFromText(text) {
  const t = (text || "").toLowerCase();
  const high = ["defect", "crack", "surface defect", "damage", "broken", "failed", "rejected", "porosity", "leak"];
  const med = ["minor", "inspection", "caution", "watch", "slight", "tolerances", "needs"];

  let score = 20;
  for (const k of high) if (t.includes(k)) score = Math.max(score, 82);
  for (const k of med) if (t.includes(k)) score = Math.max(score, 55);

  if (!t.trim()) score = 35;

  if (score >= 80) return { label: "High Risk", score };
  if (score >= 55) return { label: "Medium Risk", score };
  return { label: "Low Risk", score };
}

function AuthCard({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  }, [mode]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "register" ? "/auth/register" : mode === "manager" ? "/auth/manager-login" : "/auth/login";
      const payload = mode === "register" ? { name, email, password } : { email, password };
      const data = await api(path, { method: "POST", body: payload });
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b18] px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-[26rem] w-[26rem] rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-md justify-center pt-16">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={() => setMode(mode === "register" ? "register" : "login")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              mode !== "manager"
                ? "bg-gradient-to-r from-violet-400 to-cyan-400 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("manager");
            }}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              mode === "manager"
                ? "bg-gradient-to-r from-violet-400 to-cyan-400 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Manager Login
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto mt-8 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/65 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
            <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300" />
            {mode === "manager" ? "Manager Login" : "User Login"}
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
            {mode === "register" ? "Create account" : "Sign in"}
          </h1>
          {mode !== "manager" && (
            <p className="mt-1 text-sm text-slate-300">Separate user-side access</p>
          )}
          
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "register" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder={mode === "manager" ? "Manager email" : "Username"}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder={mode === "manager" ? "Manager password" : "Your password"}
            minLength={mode === "manager" ? 1 : 8}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none"
          />

          {mode === "manager" && (
            <p className="text-xs text-slate-400">
              Manager login only. Use: <span className="font-semibold">manager@gmail.com</span>
            </p>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-violet-400 to-cyan-400 px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "register" ? "Create account" : mode === "manager" ? "Manager Sign in" : "Sign in"}
          </button>
          {mode !== "manager" && (
            <button
              type="button"
              onClick={() => setMode(mode === "register" ? "login" : "register")}
              className="w-full text-center text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              {mode === "register" ? "Already have an account? Sign in" : "Need an account? Create one"}
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}

function Sidebar({ active, onNavigate, onHelp }) {
    const items = ["Command Center", "Orders", "Pipeline", "Quality", "Analytics", "Settings", "Help Center"];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 bg-slate-950 text-white lg:block">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400">
          <span className="text-sm font-black">PW</span>
        </div>
        <div>
          <div className="text-sm font-bold text-white">ForgeAI</div>
          <div className="text-xs text-slate-300">Order Ops Console</div>
        </div>
      </div>

      <nav className="px-5">
        <div className="space-y-2 pt-2">
          {items.map((label) => {
            const isActive = String(active || "").toLowerCase() === String(label).toLowerCase();
            return (
              <button
                key={label}
                type="button"
                onClick={() => onNavigate?.(label)}
                className={`flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5"
                }`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
                </span>
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        <button
  type="button"
  onClick={() => {
    onHelp?.();
  }}
  className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
>
  <div className="text-xs font-semibold text-slate-200">
    Need help?
  </div>

  <div className="mt-1 text-xs text-slate-300">
    Ask your website issues and get instant guidance.
  </div>
</button>
      </nav>
    </aside>
  );
}

function OrdersList({ orders }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Orders</div>
          <div className="text-xs text-slate-500">All orders for your account</div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{orders.length} total</span>
      </div>

      <div className="mt-4 overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b text-left text-slate-500">
              <th className="p-2">ID</th>
              <th className="p-2">Part</th>
              <th className="p-2">Material</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Deadline</th>
              <th className="p-2">Status</th>
              <th className="p-2">Latest Quality Note</th>
            </tr>
          </thead>
          <tbody>
            {orders
              .slice()
              .sort((a, b) => b.id - a.id)
              .map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="p-2 font-semibold">#{o.id}</td>
                  <td className="p-2">{o.part_name}</td>
                  <td className="p-2">{o.material}</td>
                  <td className="p-2">{o.quantity}</td>
                  <td className="p-2">{o.deadline}</td>
                  <td className="p-2">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="p-2">
                    {o.latest_note ? (
                      <div className="max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="font-semibold">{o.latest_note}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">No note</span>
                    )}
                  </td>
                </tr>
              ))}
            {!orders.length && (
              <tr>
                <td colSpan={7} className="p-4 text-sm text-slate-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Topbar({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-gradient-to-b from-indigo-50 via-slate-50 to-slate-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-white px-3 py-2 shadow-sm">
          <div className="text-xs text-slate-500">System</div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Online
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold">{user.name}</div>
          <div className="text-xs text-slate-500">{user.email}</div>
        </div>
        <button onClick={onLogout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
          Logout
        </button>
      </div>
    </header>
  );
}

function MobileNav({ activeSection, onNavigate }) {
  const items = ["Command Center", "Orders", "Pipeline", "Quality", "Analytics", "Settings", "Help Center"];

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="flex gap-2 overflow-auto px-3 py-2">
          {items.map((label) => {
            const isActive = String(activeSection || "").toLowerCase() === String(label).toLowerCase();
            return (
              <button
                key={label}
                type="button"
                onClick={() => onNavigate?.(label)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isActive ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HelpCenter({ helpTurns, onAsk, loading, allowedHelpQuestions }) {
  const [text, setText] = useState("");

  // Hide any generic fallback replies from the rendered history.
  const cleanedTurns = helpTurns.filter((t) => {
    const a = String(t?.a || "");
    return !(
      a.includes("I can help. Tell me your issue in one line") ||
      a.includes("You can ask about:")
    );
  });

  const submit = async (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    setText("");
    await onAsk(msg);
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Help Center</div>
          <div className="mt-1 text-xs text-slate-500">Describe any issue in the website and get guided steps.</div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Online</span>
      </div>

      <form onSubmit={submit} className="mt-4 flex items-center gap-2 rounded-xl border bg-slate-50 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask one of the supported questions (e.g., “Is my data secured”, “Quality update not working”)"
          className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Asking..." : "Ask Help"}
        </button>
      </form>

      <div className="mt-4 rounded-2xl border bg-white">
        <div className="max-h-[460px] overflow-auto overscroll-contain p-4">
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">Supported questions</div>
            <div className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-900">- {allowedHelpQuestions.join("\n- ")}</div>
          </div>

          {!cleanedTurns.length ? (
            <div className="mt-4 text-sm text-slate-500">No queries yet. Ask your first issue above.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {cleanedTurns.map((t, idx) => (
                <div key={`${t.createdAt || "t"}-${idx}`} className="rounded-xl border bg-white p-3">
                  <div className="text-[11px] font-semibold text-slate-500">You</div>
                  <div className="mt-1 whitespace-pre-wrap rounded-xl border bg-indigo-50 px-3 py-2 text-sm text-slate-900">{t.q}</div>
                  <div className="mt-3 text-[11px] font-semibold text-slate-500">Help Bot</div>
                  <div className="mt-1 whitespace-pre-wrap rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-900">{t.a}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DailyThroughput({ stats }) {
  if (!stats?.days?.length) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm font-semibold">Daily Throughput</div>
        <div className="mt-2 text-sm text-slate-500">No data yet.</div>
      </div>
    );
  }

  const width = 420;
  const height = 160;
  const padding = 18;
  const days = stats.days;
  const statuses = ["Received", "In Review", "Accepted", "Completed", "Rejected"];
  const maxVal = Math.max(
    1,
    ...statuses.flatMap((s) => (stats.data?.[s] || []).map((n) => Number(n)))
  );

  const xFor = (i) => padding + (i * (width - padding * 2)) / (days.length - 1 || 1);
  const yFor = (v) => height - padding - (v * (height - padding * 2)) / maxVal;

  const color = {
    Received: "#10b981",
    "In Review": "#f59e0b",
    Accepted: "#8b5cf6",
    Completed: "#38bdf8",
    Rejected: "#f43f5e",
  };

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Daily Throughput</div>
          <div className="text-xs text-slate-500">Status changes in last {days.length} days</div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Auto</span>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border bg-slate-50">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[170px] w-full">
          {/* grid */}
          {[0, 1, 2, 3].map((g) => {
            const y = padding + (g * (height - padding * 2)) / 3;
            return <line key={g} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
          })}

          {statuses.map((s) => {
            const arr = stats.data?.[s] || [];
            const points = arr.map((v, i) => `${xFor(i)},${yFor(Number(v))}`).join(" ");
            if (!points.includes("NaN")) {
              return (
                <g key={s}>
                  <polyline points={points} fill="none" stroke={color[s]} strokeWidth="2" opacity={0.95} />
                  {/* dots */}
                  {arr.map((v, i) => (
                    <circle key={i} cx={xFor(i)} cy={yFor(Number(v))} r="3.2" fill={color[s]} opacity={0.9} />
                  ))}
                </g>
              );
            }
            return null;
          })}

          {/* x labels */}
          {days.map((d, i) => {
            const label = new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
            return (
              <text key={d + i} x={xFor(i)} y={height - 4} textAnchor="middle" fontSize="10" fill="#64748b">
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function QualityAnalyzer({ orders }) {
  // Use latest note across accepted orders.
  const accepted = useMemo(
    () => orders.filter((o) => o.status === "Accepted" || o.status === "Completed"),
    [orders]
  );

  const latest = useMemo(() => {
    const candidates = accepted
      .filter((o) => o.latest_note)
      .map((o) => ({
        o,
        at: o.latest_note_at ? new Date(o.latest_note_at).getTime() : 0,
      }))
      .sort((a, b) => b.at - a.at);
    return candidates[0]?.o || null;
  }, [accepted]);

  const analysis = useMemo(() => {
    const note = latest?.latest_note || "";
    const r = computeRiskFromText(note);
    return {
      riskLabel: r.label,
      riskScore: r.score,
      recommended: r.label === "High Risk" ? "Re-check dimensions and surface finish. Flag for rework." : r.label === "Medium Risk" ? "Proceed with standard QC and monitor tolerance ranges." : "Looks good. Continue to dispatch planning.",
    };
  }, [latest]);

  const progress = analysis.riskScore;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">AI Quality Analyzer</div>
          <div className="text-xs text-slate-500">Heuristic parsing over latest quality note</div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {latest ? `Order #${latest.id}` : "No accepted note"}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
        <div className="flex items-center justify-center">
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 120 120" className="absolute inset-0">
              <circle cx="60" cy="60" r="46" stroke="#e5e7eb" strokeWidth="10" fill="none" />
              <circle
                cx="60"
                cy="60"
                r="46"
                stroke="#8b5cf6"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={((100 - progress) / 100) * (2 * Math.PI * 46)}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-sm font-black">{progress}%</div>
              <div className="text-[10px] font-semibold text-slate-500">Risk</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">{analysis.riskLabel}</div>
          <div className="mt-2 text-xs text-slate-600">{analysis.recommended}</div>
          <div className="mt-3 rounded-xl border bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">Latest note</div>
            <div className="mt-1 max-h-[64px] overflow-hidden text-sm text-slate-800">
              {latest?.latest_note || "No quality note has been logged for an accepted order yet."}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{latest ? fmtDT(latest.latest_note_at) : ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveActivity({ events }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Live Factory Feed</div>
          <div className="text-xs text-slate-500">Status updates & quality logs</div>
        </div>
        <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">LIVE</span>
      </div>

      <div className="mt-3 space-y-2">
        {events?.length ? (
          events.map((e) => (
            <div key={`${e.orderId}-${e.createdAt}`} className="rounded-xl border bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">Order #{e.orderId}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    {e.type === "status" ? "Status" : "Quality"}: <span className="font-semibold text-slate-900">{e.value}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 truncate">
                    {e.partName ? `${e.partName} • Qty ${e.quantity}` : ""}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">{fmtDT(e.createdAt)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">No activity yet. Create an order from chat.</div>
        )}
      </div>
    </div>
  );
}

function ChatPanel({ chat, onSend, loading }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const quickExamples = [
    "Quality update on order #3 — passed visual inspection, no surface defects",
    "show me all accepted orders",
  ];

  const submit = async (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    setText("");
    await onSend(msg);
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">AI Assistant</div>
          <div className="text-xs text-slate-500">Order Tracking Dashboard</div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">System Online</span>
      </div>
      <div className="mt-3 h-[260px] min-h-0 overflow-auto overscroll-contain rounded-xl border bg-slate-50 p-3 sm:h-[320px] lg:flex-1 lg:h-auto">
        <div className="space-y-2">
          {chat.map((m, idx) => (
            <div
              key={`${idx}-${m.role}`}
              className={`max-w-[95%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                m.role === "user" ? "ml-auto bg-blue-100 text-slate-900" : "mr-auto bg-slate-200 text-slate-900"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mt-3 grid shrink-0 gap-2">
        <div className="flex flex-wrap gap-2">
          {quickExamples.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => onSend(ex)}
              className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {ex.length > 26 ? ex.slice(0, 26) + "..." : ex}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a request..."
            className="flex-1 rounded-xl border px-3 py-2 text-sm"
          />
          <button
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PipelineBoard({ orders, onOpenOrder, filterStatus, onClearFilter }) {
  const columns = ["Received", "In Review", "Accepted", "Completed", "Rejected"];
  const shownCount = filterStatus ? orders.filter((o) => o.status === filterStatus).length : orders.length;

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(columns.map((s) => [s, []]));
    for (const o of orders) {
      if (!map[o.status]) continue;
      if (filterStatus && o.status !== filterStatus) continue;
      map[o.status].push(o);
    }
    for (const s of columns) map[s].sort((a, b) => b.id - a.id);
    return map;
  }, [orders, filterStatus]);

  const columnTint = {
    Received: "bg-emerald-50",
    "In Review": "bg-amber-50",
    Accepted: "bg-violet-50",
    Completed: "bg-sky-50",
    Rejected: "bg-rose-50",
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Order Pipeline</div>
          <div className="text-xs text-slate-500">Drag not required; chat updates status</div>
        </div>
        <div className="flex items-center gap-2">
          {filterStatus ? (
            <button
              type="button"
              onClick={onClearFilter}
              className="rounded-xl border bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          ) : null}
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{shownCount} total</span>
        </div>
      </div>

      <div className="mt-4 h-[420px] overflow-hidden md:h-[520px]">
        <div className="flex h-full gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-x-hidden md:pb-0">
          {columns.map((s) => (
            <div key={s} className="flex min-h-0 min-w-[220px] flex-col rounded-2xl border bg-slate-50 p-3 md:min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700">{s}</div>
              <div className="text-xs font-semibold text-slate-500">{byStatus[s].length}</div>
            </div>
            <div className="mt-2 min-h-0 flex-1 overflow-auto space-y-2 pr-1">
              {byStatus[s].slice(0, 6).map((o) => (
                <button
                  key={o.id}
                  onClick={() => onOpenOrder(o.id)}
                  type="button"
                  className={`w-full rounded-xl border bg-white p-3 text-left hover:bg-slate-50`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-900">#{o.id}</div>
                    <StatusPill status={o.status} />
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-700">{o.part_name}</div>
                  <div className="mt-1 text-[11px] text-slate-500">Mat: {o.material}</div>
                  <div className="mt-1 text-[11px] text-slate-500">Qty: {o.quantity}</div>
                  <div className="mt-1 text-[11px] text-slate-500">DL: {o.deadline}</div>
                  {o.latest_note ? (
                    <div className="mt-2 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-slate-800">
                      {o.latest_note}
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-slate-400">No quality note</div>
                  )}
                </button>
              ))}
              {byStatus[s].length > 6 && (
                <div className="text-[11px] font-semibold text-slate-500">+{byStatus[s].length - 6} more</div>
              )}
              {!byStatus[s].length && <div className="text-[11px] text-slate-400">Empty</div>}
            </div>
          </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
        <span>Tip: Try “Mark order #X as accepted” then “Quality update on order #X ...”</span>
      </div>
    </div>
  );
}

function OrderModal({ open, order, onClose, onRefresh }) {
  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-3xl rounded-2xl border bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-500">Order</div>
            <div className="mt-1 flex items-center gap-3">
              <div className="text-xl font-black">#{order.id}</div>
              <StatusPill status={order.status} />
            </div>
            <div className="mt-3 text-sm text-slate-700">
              <span className="font-semibold">{order.part_name}</span> • {order.material} • Qty {order.quantity} • Deadline{" "}
              <span className="font-semibold">{order.deadline}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-sm font-semibold">Quality Notes</div>
            <div className="mt-3 space-y-3 max-h-[260px] overflow-auto pr-1">
              {order.notes?.length ? (
                order.notes.map((n, i) => (
                  <div key={n.createdAt + i} className="rounded-xl border bg-white p-3">
                    <div className="text-xs font-semibold text-slate-700">Note</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{n.note}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{fmtDT(n.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No quality notes yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Status History</div>
              <button type="button" onClick={onRefresh} className="rounded-lg border bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Refresh
              </button>
            </div>
            <div className="mt-3 space-y-2 max-h-[260px] overflow-auto pr-1">
              {order.history?.length ? (
                order.history.map((h, i) => (
                  <div key={h.createdAt + i} className="rounded-xl border bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-slate-700">
                        {h.type === "status" ? "Status" : "Quality"}:{" "}
                        <span className="text-slate-900">{h.value}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{fmtDT(h.createdAt)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No history yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold text-slate-800">Suggested Commands</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {[
              `Mark order #${order.id} as in review`,
              `Mark order #${order.id} as accepted`,
              `Quality update on order #${order.id} — passed visual inspection, no surface defects`,
              `show me all accepted orders`,
            ].map((cmd) => (
              <span key={cmd} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                {cmd}
              </span>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Tip: copy/paste these into the chat to update this order.</div>
        </div>
      </motion.div>
    </div>
  );
}

function KpiRow({ orders }) {
  const countBy = (s) => orders.filter((o) => o.status === s).length;
  const total = orders.length;
  const received = countBy("Received");
  const inReview = countBy("In Review");
  const accepted = countBy("Accepted");
  const completed = countBy("Completed");

  const Card = ({ title, value, tone }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-white p-4 shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500">{title}</div>
          <div className="mt-2 text-2xl font-black">{value}</div>
        </div>
        <div className={`h-10 w-10 rounded-xl ${tone}`} />
      </div>
      <div className="mt-2 text-[11px] font-semibold text-slate-500">
        {title === "Total Orders"
          ? "All orders for your account"
          : "Based on current pipeline"}
      </div>
    </motion.div>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="Total Orders" value={total} tone="bg-indigo-100" />
      <Card title="Accepted Orders" value={accepted} tone="bg-violet-100" />
      <Card title="In Review" value={inReview} tone="bg-amber-100" />
      <Card title="Completed" value={completed} tone="bg-sky-100" />
    </div>
  );
}

function ManagerApp({ auth, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/manager/orders", { token: auth.token });
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message || "Failed to load manager orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  const counts = useMemo(() => {
    const c = { accepted: 0, inReview: 0, completed: 0 };
    for (const o of orders) {
      if (o.status === "Accepted") c.accepted += 1;
      if (o.status === "In Review") c.inReview += 1;
      if (o.status === "Completed") c.completed += 1;
    }
    return c;
  }, [orders]);

  const setStatus = async (orderId, nextStatus) => {
    await api(`/manager/orders/${orderId}/status`, {
      token: auth.token,
      method: "POST",
      body: { status: nextStatus },
    });
    await load();
  };

  const actionsFor = (status) => {
    if (status === "Received") return ["In Review", "Rejected"];
    if (status === "In Review") return ["Accepted", "Rejected"];
    if (status === "Accepted") return ["Completed", "Rejected"];
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-slate-100">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400">
                <span className="text-sm font-black">PW</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Manager Console</div>
                <div className="text-xs text-slate-500">All users & orders</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                Reviewed: <span className="font-black">{counts.inReview}</span>
              </span>
              <span className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                Accepted: <span className="font-black">{counts.accepted}</span>
              </span>
              <span className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                Completed: <span className="font-black">{counts.completed}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold">{auth.user?.name || "Manager"}</div>
                <div className="text-xs text-slate-500">{auth.user?.email}</div>
              </div>
              <button
                onClick={onLogout}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-5">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Orders</div>
              <div className="text-xs text-slate-500">User details + order details</div>
            </div>
            <button
              type="button"
              onClick={load}
              className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {error ? <div className="mt-3 text-sm font-semibold text-rose-600">{error}</div> : null}
          {loading ? <div className="mt-3 text-sm text-slate-500">Loading...</div> : null}

          <div className="mt-4 overflow-auto rounded-xl border">
            <table className="min-w-[980px] text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b text-left text-slate-500">
                  <th className="p-2">Order</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Part</th>
                  <th className="p-2">Material</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Deadline</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const nexts = actionsFor(o.status);
                  return (
                    <tr key={o.id} className="border-b align-top">
                      <td className="p-2 font-semibold">#{o.id}</td>
                      <td className="p-2">
                        <div className="font-semibold text-slate-900">{o.user_name}</div>
                        <div className="text-xs text-slate-500">{o.user_email}</div>
                      </td>
                      <td className="p-2">{o.part_name}</td>
                      <td className="p-2">{o.material}</td>
                      <td className="p-2">{o.quantity}</td>
                      <td className="p-2">{o.deadline}</td>
                      <td className="p-2">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          {nexts.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(o.id, s)}
                              className="rounded-lg border bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Mark {s}
                            </button>
                          ))}
                          {!nexts.length ? <span className="text-xs text-slate-400">No actions</span> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && !orders.length ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-sm text-slate-500">
                      No orders yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardApp() {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  });

  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [pipelineFilter, setPipelineFilter] = useState(null);

  const [loadingChat, setLoadingChat] = useState(false);
  const [chat, setChat] = useState([{ role: "bot", text: "Good morning! Describe an order requirement, status update, or quality report." }]);

  const [loadingHelp, setLoadingHelp] = useState(false);
  const [helpTurns, setHelpTurns] = useState([]);

  const allowedHelpQuestions = useMemo(
    () => [
      "Is my data secured?",
      "Why the website loading slowly",
      "Quality update not working",
      "How do I create an order?",
      "How do I create an account?",
    ],
    []
  );

  const normalizeHelpQ = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[?!.]/g, "")
      .replace(/\s+/g, " ");

  const helpAnswerByNormalizedQuestion = useMemo(
    () => ({
      "is my data secured": `Data security (in this demo app):
1) Passwords are NOT stored in plain text — they are hashed with bcrypt.
2) Login uses JWT tokens (sent in the Authorization header) to protect API routes.
3) Orders/quality notes are stored in a local SQLite database on the backend server.
How to make it safer in production:
4) Set a strong, unique JWT_SECRET (never the default).
5) Use HTTPS and enable rate limiting + audit logs.
6) Store secrets securely (environment/secret manager) and rotate keys.`,

      "why the website loading slowly": `If the website is loading slowly:
1) Check backend is running and not restarting/crashing (http://localhost:4000).
2) Hard refresh the frontend (Ctrl+F5) and keep browser zoom at 100%.
3) Test in an incognito window to rule out extensions/cache issues.
4) In dev mode, first load can be slower because Vite compiles — later reloads should be faster.
If it’s still slow, tell me which page is slow (Command Center / Orders / Pipeline / Help Center) and share any console error.`,

      "quality update not working": `Quality updates only work after an order is Accepted.
Try this:
1) Open the Pipeline and confirm the order status is "Accepted".
2) Send the exact format:
   "Quality update on order #<id> - <your quality note>"
   Example: "Quality update on order #3 - passed visual inspection, no surface defects"
3) Refresh the order modal and confirm the note appears in Quality Notes.
If it still fails, include the order number and what status you see for that order.`,

      "how do i create an order": `To create an order, use this command in the chat:
1) "I need <qty> <material> <part> delivered by <date>"
2) Example: "I need 200 titanium flanges delivered by July 20"
3) Wait for confirmation like: "Order created as #X. Status set to Received."
4) Open the Orders tab to verify the new order appears.`,

      "how do i create an account": `To create an account:
1) Use the User Login screen (not Manager Login).
2) Click "Need an account? Create one" under the Sign in button.
3) Fill in your name, email, and a password with at least 8 characters.
4) Submit the form — if successful, you’ll be logged in automatically.`,
    }),
    []
  );

  const [modalState, setModalState] = useState({ open: false, order: null, loading: false, orderId: null });
  const [activeSection, setActiveSection] = useState("Command Center");

  const loadAll = async () => {
    const results = await Promise.allSettled([
      api("/orders", { token: auth.token }),
      api("/activity", { token: auth.token }),
      api("/stats?days=7", { token: auth.token }),
    ]);

    if (results[0]?.status === "fulfilled") setOrders(results[0].value.orders || []);
    if (results[1]?.status === "fulfilled") setEvents(results[1].value.events || []);
    if (results[2]?.status === "fulfilled") setStats(results[2].value || null);
  };

  useEffect(() => {
    if (!auth) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  const send = async (message) => {
    setLoadingChat(true);
    setChat((prev) => [...prev, { role: "user", text: message }]);
    try {
      const data = await api("/chat", { token: auth.token, method: "POST", body: { message } });
      setChat((prev) => [...prev, { role: "bot", text: data.reply }]);
      if (data?.listStatus?.all) setPipelineFilter(null);
      else if (data?.listStatus?.status) setPipelineFilter(data.listStatus.status);
    } catch (err) {
      setChat((prev) => [...prev, { role: "bot", text: err.message }]);
    } finally {
      // Refresh what we can; widget failures should not prevent order creation from appearing.
      await loadAll();
      setLoadingChat(false);
    }
  };

  const askHelp = async (question) => {
    const norm = normalizeHelpQ(question);
    const answer = helpAnswerByNormalizedQuestion[norm];

    // Keep Help Center strictly limited to supported questions.
    if (!answer) {
      setHelpTurns((prev) => [
        {
          q: question,
          a: `Please ask only one of these:\n- ${allowedHelpQuestions.join("\n- ")}`,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      return;
    }

    setLoadingHelp(true);
    try {
      setHelpTurns((prev) => [{ q: question, a: answer, createdAt: new Date().toISOString() }, ...prev]);
    } finally {
      setLoadingHelp(false);
    }
  };

  const openOrder = async (orderId) => {
    setModalState((s) => ({ ...s, open: true, loading: true, orderId }));
    try {
      const data = await api(`/orders/${orderId}`, { token: auth.token });
      setModalState({ open: true, loading: false, orderId, order: { ...data.order, notes: data.notes, history: data.history } });
    } catch (err) {
      setModalState({ open: false, order: null, loading: false, orderId: null });
    }
  };

  const refreshModal = async () => {
    if (!modalState.orderId) return;
    await openOrder(modalState.orderId);
  };

  const logout = () => {
    localStorage.removeItem("auth");
    setAuth(null);
  };

  const handleAuth = (data) => {
    localStorage.setItem("auth", JSON.stringify(data));
    setAuth(data);
  };

  if (!auth) return <AuthCard onAuth={handleAuth} />;
  if (auth?.user?.role === "manager") return <ManagerApp auth={auth} onLogout={logout} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-slate-100">
      <div className="lg:flex">
<Sidebar
  active={activeSection}
  onNavigate={setActiveSection}
  onHelp={() => {
    setActiveSection("Help Center");
    setHelpTurns([]);
  }}
/>        <div className="flex-1">
          <MobileNav activeSection={activeSection} onNavigate={setActiveSection} />
          <Topbar user={auth.user} onLogout={logout} />

          <main className="px-4 pb-10">
            {activeSection === "Command Center" && (
              <>
                <div className="sticky top-[74px] z-30 -mx-4 bg-gradient-to-b from-indigo-50 via-slate-50 to-slate-100 px-4 py-2">
                  <KpiRow orders={orders} />
                </div>
                <div className="mt-2 grid gap-4 lg:grid-cols-[360px_1fr]">
                  <div className="hidden lg:block lg:h-[calc(100vh-11.5rem)]" aria-hidden />
                  <motion.section
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 lg:fixed lg:left-[17rem] lg:top-[13rem] lg:z-30 lg:h-[calc(100vh-14rem)] lg:w-[330px]"
                  >
                    <ChatPanel chat={chat} onSend={send} loading={loadingChat} />
                  </motion.section>

                  <div className="space-y-4 lg:col-start-2">
                    <QualityAnalyzer orders={orders} />
                    <DailyThroughput stats={stats} />
                    <LiveActivity events={events} />
                  </div>
                </div>
              </>
            )}

            {activeSection === "Orders" && <OrdersList orders={orders} />}

            {activeSection === "Pipeline" && (
              <div className="mt-4">
                <PipelineBoard
                  orders={orders}
                  onOpenOrder={openOrder}
                  filterStatus={pipelineFilter}
                  onClearFilter={() => setPipelineFilter(null)}
                />
              </div>
            )}

            {activeSection === "Quality" && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <QualityAnalyzer orders={orders} />
                <div className="rounded-2xl border bg-white p-4">
                  <div className="text-sm font-semibold">Recent Quality Notes</div>
                  <div className="text-xs text-slate-500">Only accepted/completed orders</div>
                  <div className="mt-3 max-h-[420px] overflow-auto space-y-3 pr-1">
                    {orders
                      .filter((o) => o.status === "Accepted" || o.status === "Completed")
                      .filter((o) => o.latest_note)
                      .slice()
                      .sort((a, b) => new Date(b.latest_note_at).getTime() - new Date(a.latest_note_at).getTime())
                      .slice(0, 10)
                      .map((o) => (
                        <div key={o.id} className="rounded-xl border bg-slate-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">Order #{o.id}</div>
                            <StatusPill status={o.status} />
                          </div>
                          <div className="mt-2 text-sm font-semibold">{o.latest_note}</div>
                          <div className="mt-1 text-[11px] text-slate-500">{fmtDT(o.latest_note_at)}</div>
                        </div>
                      ))}
                    {!orders.some((o) => (o.status === "Accepted" || o.status === "Completed") && o.latest_note) && (
                      <div className="text-sm text-slate-500">No quality notes yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "Analytics" && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <DailyThroughput stats={stats} />
                <LiveActivity events={events} />
              </div>
            )}

            {activeSection === "Settings" && (
              <div className="mt-4 rounded-2xl border bg-white p-5">
                <div className="text-sm font-semibold">Settings</div>
                <div className="mt-1 text-xs text-slate-500">Demo uses SQLite and JWT.</div>
                <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                  <div className="text-sm font-semibold">{auth.user.name}</div>
                  <div className="text-xs text-slate-600">{auth.user.email}</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={logout}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "Help Center" && (
              <div className="mt-4">
                <HelpCenter helpTurns={helpTurns} onAsk={askHelp} loading={loadingHelp} allowedHelpQuestions={allowedHelpQuestions} />
              </div>
            )}
          </main>
        </div>
      </div>

      <OrderModal
        open={modalState.open && !modalState.loading}
        order={modalState.order}
        onClose={() => setModalState({ open: false, order: null, loading: false, orderId: null })}
        onRefresh={refreshModal}
      />
    </div>
  );
}

