import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "./api";

function AuthCard({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "register" ? "/auth/register" : "/auth/login";
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-20 w-full max-w-md rounded-xl border bg-white p-6 shadow-lg"
    >
      <h1 className="text-2xl font-bold">PrecisionWorks</h1>
      <p className="text-sm text-slate-500">Secure access to conversational order management</p>

      <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md px-3 py-2 text-sm ${mode === "login" ? "bg-white shadow" : ""}`}
        >
          Login
        </button>
        <button
          onClick={() => setMode("register")}
          className={`flex-1 rounded-md px-3 py-2 text-sm ${mode === "register" ? "bg-white shadow" : ""}`}
        >
          Register
        </button>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        {mode === "register" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            className="w-full rounded-lg border px-3 py-2"
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-lg border px-3 py-2"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password (min 8 chars)"
          minLength={8}
          required
          className="w-full rounded-lg border px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
        </button>
      </form>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Received: "bg-emerald-100 text-emerald-700",
    "In Review": "bg-amber-100 text-amber-700",
    Accepted: "bg-violet-100 text-violet-700",
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || "bg-slate-100"}`}>{status}</span>;
}

function Workspace({ auth, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState([
    { role: "bot", text: "I can create orders, update status, add quality notes, and list accepted orders." },
  ]);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await api("/orders", { token: auth.token });
      setOrders(data.orders);
    } catch (err) {
      setChat((prev) => [...prev, { role: "bot", text: err.message }]);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const message = chatInput.trim();
    setChatInput("");
    setChat((prev) => [...prev, { role: "user", text: message }]);
    setLoading(true);
    try {
      const data = await api("/chat", {
        method: "POST",
        token: auth.token,
        body: { message },
      });
      setChat((prev) => [...prev, { role: "bot", text: data.reply }]);
      await loadOrders();
    } catch (err) {
      setChat((prev) => [...prev, { role: "bot", text: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-5">
      <header className="mb-4 flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">AI Order Management</h2>
          <p className="text-sm text-slate-500">{auth.user.email} • {auth.user.name}</p>
        </div>
        <button onClick={onLogout} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Logout
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <motion.section
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <h3 className="font-semibold">Chat Interface</h3>
          <div className="mt-3 h-[460px] space-y-2 overflow-auto rounded-lg border bg-slate-50 p-3">
            {chat.map((m, idx) => (
              <div
                key={`${idx}-${m.role}`}
                className={`max-w-[95%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-auto bg-blue-100" : "mr-auto bg-slate-200"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <form onSubmit={send} className="mt-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your requirement..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              {loading ? "..." : "Send"}
            </button>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Your Orders</h3>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{orders.length} Orders</span>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
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
                {orders.map((o) => (
                  <tr key={o.id} className="border-b">
                    <td className="p-2">#{o.id}</td>
                    <td className="p-2">{o.part_name}</td>
                    <td className="p-2">{o.material}</td>
                    <td className="p-2">{o.quantity}</td>
                    <td className="p-2">{o.deadline}</td>
                    <td className="p-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="p-2">
                      {o.latest_note ? (
                        <div>
                          <div>{o.latest_note}</div>
                          <div className="text-xs text-slate-400">{new Date(o.latest_note_at).toLocaleString()}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">No note</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
  });

  const handleAuth = (data) => {
    setAuth(data);
    localStorage.setItem("auth", JSON.stringify(data));
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
  };

  return <div>{auth ? <Workspace auth={auth} onLogout={logout} /> : <AuthCard onAuth={handleAuth} />}</div>;
}
