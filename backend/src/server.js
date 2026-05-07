require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const { parseMessage } = require("./nlp");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "hackathon_super_secret_change_me";
const MANAGER_EMAIL = "manager@gmail.com";
const MANAGER_PASSWORD = "Manager*123";

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
      return ok ? cb(null, true) : cb(new Error("CORS not allowed"), false);
    },
    credentials: true,
  })
);
app.use(express.json());

const ORDER_FLOW = ["Received", "In Review", "Accepted", "Completed"];
const TRANSITIONS = {
  Received: new Set(["In Review", "Rejected"]),
  "In Review": new Set(["Accepted", "Rejected"]),
  Accepted: new Set(["Completed", "Rejected"]),
  Completed: new Set(),
  Rejected: new Set(),
};

function createToken(user) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role || "user" }, JWT_SECRET, { expiresIn: "8h" });
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function managerOnly(req, res, next) {
  if (req.user?.role !== "manager") return res.status(403).json({ message: "Manager access required." });
  return next();
}

function statusTransitionAllowed(current, next) {
  const allowed = TRANSITIONS[current];
  if (!allowed) return false;
  return allowed.has(next);
}

function buildHelpReply(message) {
  const t = String(message || "").toLowerCase();

  if (/(data\s*(secure|secured|security)|secure\s*data|privacy|safe|encryption|encrypt|hack|breach)/i.test(t)) {
    return `Data security (in this demo app):
1) Passwords are NOT stored in plain text — they are hashed with bcrypt.
2) Login uses JWT tokens (sent in Authorization header) to protect API routes.
3) Orders/notes are stored in a local SQLite database on the backend server.
4) Important: this is a hackathon/demo setup. For production you should:
   - set a strong JWT_SECRET in .env (don’t use the default)
   - use HTTPS
   - enable rate limiting + audit logs
   - store secrets securely and rotate keys`;
  }

  if (/(slow|loading\s*slow|website\s*loading\s*slow|lag|takes\s*long|performance)/i.test(t)) {
    return `If the website is loading slowly, try:
1) Confirm backend is running (http://localhost:4000) and not restarting/crashing.
2) Hard refresh the frontend (Ctrl+F5) and keep browser zoom at 100%.
3) Close extra tabs/apps and test in an incognito window.
4) In dev mode, first load can be slower due to Vite compiling — subsequent reloads should be faster.
5) If it’s still slow, tell me which page is slow (Command Center / Orders / Pipeline / Help Center) and what you see in the browser console.`;
  }

  if (/(create\s+account|sign\s*up|register\s+account|new\s+account)/i.test(t)) {
    return `To create an account:
1) On the login screen, use the User Login mode (not Manager Login).
2) Click “Need an account? Create one” under the password field.
3) Fill in your full name, email, and a password with at least 8 characters.
4) Submit the form; if successful you’ll be logged in automatically and see the Command Center.
5) If you see “Email already registered”, go back and use the normal Sign in button instead.`;
  }

  if (/(login|sign in|auth|password|credential)/i.test(t)) {
    return `Try these steps:
1) Confirm backend is running on http://localhost:4000 and frontend is running.
2) Use the correct tab: User Login for users, Manager Login for manager@gmail.com.
3) Re-enter email and password manually (no extra spaces).
4) If you see "Failed to fetch", restart backend and refresh browser (Ctrl+F5).`;
  }

  if (/(create|new order|need|require|manufacture|make)/i.test(t)) {
    return `To create an order, use this format:
1) "I need <qty> <material> <part> delivered by <date>"
2) Example: "I need 200 titanium flanges delivered by July 20"
3) Wait for confirmation: "Order created as #X. Status set to Received."
4) Open Orders tab to verify the new order appears.`;
  }

  if (/(status|review|accept|complete|reject|rejected)/i.test(t)) {
    return `To update status, follow pipeline order:
1) Received -> In Review
2) In Review -> Accepted (or Rejected)
3) Accepted -> Completed
Command example: "Mark order #3 as in review"`;
  }

  if (/(quality|inspection|qa|defect|surface)/i.test(t)) {
    return `To add quality notes:
1) First ensure the order is in Accepted status.
2) Use command: "Quality update on order #3 - <your note>"
3) Example: "Quality update on order #3 - passed visual inspection, no surface defects"
4) If it says not working:
   - confirm the order is Accepted (quality updates are blocked otherwise)
   - include an order number: "Quality update on order #<id> - ..."
   - refresh and open the order modal to confirm it was saved.`;
  }

  if (/(dashboard|scroll|ui|mobile|layout|visible|sticky)/i.test(t)) {
    return `For dashboard UI issues, try:
1) Hard refresh the page (Ctrl+F5).
2) Ensure browser zoom is 100%.
3) Re-open Command Center and test scroll behavior.
4) Share a screenshot and exact issue area (chat, KPI row, right cards) for targeted fix.`;
  }

  return `I can help. Tell me your issue in one line and I will give step-by-step fixes.
You can ask about:
1) Login problems
2) Creating orders
3) Status updates
4) Quality updates
5) Dashboard/scroll UI issues`;
}

function ensureManagerSeed() {
  const email = "manager@gmail.com";
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return;
  const hash = bcrypt.hashSync("Manager*123", 10);
  const now = new Date().toISOString();
  db.prepare("INSERT INTO users (name, email, password_hash, created_at, role) VALUES (?, ?, ?, ?, ?)").run(
    "Manager",
    email,
    hash,
    now,
    "manager"
  );
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ message: "Name, email, and strong password are required." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) return res.status(409).json({ message: "Email already registered. Please login." });

  const hash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, created_at, role) VALUES (?, ?, ?, ?, ?)")
    .run(name.trim(), email.toLowerCase(), hash, now, "user");

  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(result.lastInsertRowid);
  const token = createToken(user);
  res.status(201).json({ token, user });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!user) return res.status(404).json({ message: "User not found. Please register first." });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Incorrect password." });

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role || "user" };
  const token = createToken(safeUser);
  res.json({ token, user: safeUser });
});

// Dedicated manager login for a separate manager-only auth flow.
app.post("/auth/manager-login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

  if (String(email).toLowerCase() !== MANAGER_EMAIL || String(password) !== MANAGER_PASSWORD) {
    return res.status(401).json({ message: "Invalid manager credentials." });
  }

  const manager = { id: 0, name: "Manager", email: MANAGER_EMAIL, role: "manager" };
  const token = createToken(manager);
  return res.json({ token, user: manager });
});

// Manager: list all orders with user details
app.get("/manager/orders", authMiddleware, managerOnly, (req, res) => {
  const rows = db
    .prepare(
      `SELECT o.*,
              u.name as user_name,
              u.email as user_email,
              (SELECT note FROM order_notes n WHERE n.order_id = o.id ORDER BY n.id DESC LIMIT 1) AS latest_note,
              (SELECT created_at FROM order_notes n WHERE n.order_id = o.id ORDER BY n.id DESC LIMIT 1) AS latest_note_at
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC`
    )
    .all();
  res.json({ orders: rows });
});

// Manager: update order status
app.post("/manager/orders/:id/status", authMiddleware, managerOnly, (req, res) => {
  const orderId = Number(req.params.id);
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ message: "status is required." });

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!order) return res.status(404).json({ message: "Order not found." });

  if (!statusTransitionAllowed(order.status, status)) {
    return res.status(400).json({ message: `Invalid transition: ${order.status} -> ${status}.` });
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
  db.prepare("INSERT INTO order_history (order_id, event_type, event_value, created_at) VALUES (?, ?, ?, ?)").run(
    orderId,
    "status",
    status,
    now
  );
  res.json({ ok: true });
});

app.get("/orders", authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT o.*,
        (SELECT note FROM order_notes n WHERE n.order_id = o.id ORDER BY n.id DESC LIMIT 1) AS latest_note,
        (SELECT created_at FROM order_notes n WHERE n.order_id = o.id ORDER BY n.id DESC LIMIT 1) AS latest_note_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.id DESC`
    )
    .all(req.user.userId);
  res.json({ orders: rows });
});

app.get("/orders/:id", authMiddleware, (req, res) => {
  const orderId = Number(req.params.id);
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(orderId, req.user.userId);
  if (!order) return res.status(404).json({ message: "Order not found for this user." });

  const notes = db
    .prepare("SELECT note, created_at FROM order_notes WHERE order_id = ? ORDER BY id DESC")
    .all(orderId)
    .map((n) => ({ note: n.note, createdAt: n.created_at }));

  const history = db
    .prepare(
      `SELECT event_type, event_value, created_at
       FROM order_history
       WHERE order_id = ?
       ORDER BY id DESC
       LIMIT 30`
    )
    .all(orderId)
    .map((h) => ({ type: h.event_type, value: h.event_value, createdAt: h.created_at }));

  res.json({ order, notes, history });
});

app.get("/activity", authMiddleware, (req, res) => {
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const rows = db
    .prepare(
      `SELECT h.event_type, h.event_value, h.created_at, h.order_id,
              o.part_name, o.quantity, o.status, o.deadline
       FROM order_history h
       JOIN orders o ON o.id = h.order_id
       WHERE o.user_id = ?
       ORDER BY h.id DESC
       LIMIT ?`
    )
    .all(req.user.userId, limit)
    .map((r) => ({
      orderId: r.order_id,
      type: r.event_type,
      value: r.event_value,
      createdAt: r.created_at,
      partName: r.part_name,
      quantity: r.quantity,
      status: r.status,
      deadline: r.deadline,
    }));
  res.json({ events: rows });
});

app.get("/stats", authMiddleware, (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days || 7), 1), 30);
  // SQLite date buckets (YYYY-MM-DD)
  const rows = db
    .prepare(
      `SELECT date(h.created_at) as day, h.event_value as status, COUNT(*) as c
       FROM order_history h
       JOIN orders o ON o.id = h.order_id
       WHERE o.user_id = ?
         AND h.event_type = 'status'
         AND date(h.created_at) >= date('now', '-' || ? || ' days')
       GROUP BY day, status
       ORDER BY day ASC`
    )
    .all(req.user.userId, days);

  // Build buckets
  const now = new Date();
  const bucketDays = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    bucketDays.push(d.toISOString().slice(0, 10));
  }

  const statuses = ["Received", "In Review", "Accepted", "Completed", "Rejected"];
  const data = Object.fromEntries(statuses.map((s) => [s, Array(days).fill(0)]));

  const dayIndex = new Map(bucketDays.map((d, i) => [d, i]));
  for (const r of rows) {
    const idx = dayIndex.get(r.day);
    if (idx === undefined) continue;
    if (data[r.status]) data[r.status][idx] += Number(r.c);
  }
  res.json({ days: bucketDays, data });
});

app.post("/chat", authMiddleware, (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "Message is required." });

  const parsed = parseMessage(message.trim());
  const now = new Date().toISOString();

  if (parsed.createOrder) {
    const { partName, material, quantity, deadline } = parsed.createOrder;
    const result = db
      .prepare(
        `INSERT INTO orders (user_id, part_name, material, quantity, deadline, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'Received', ?)`
      )
      .run(req.user.userId, partName, material, quantity, deadline, now);

    db.prepare("INSERT INTO order_history (order_id, event_type, event_value, created_at) VALUES (?, ?, ?, ?)")
      .run(result.lastInsertRowid, "status", "Received", now);

    return res.json({
      reply: `Order created as #${result.lastInsertRowid}. Status set to Received.`,
    });
  }

  if (parsed.statusUpdate) {
    const order = db
      .prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?")
      .get(parsed.statusUpdate.orderId, req.user.userId);
    if (!order) return res.status(404).json({ message: "Order not found for this user." });

    if (!statusTransitionAllowed(order.status, parsed.statusUpdate.status)) {
      return res.status(400).json({
        message: `Invalid transition: ${order.status} -> ${parsed.statusUpdate.status}.`,
      });
    }

    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(parsed.statusUpdate.status, order.id);
    db.prepare("INSERT INTO order_history (order_id, event_type, event_value, created_at) VALUES (?, ?, ?, ?)")
      .run(order.id, "status", parsed.statusUpdate.status, now);
    return res.json({ reply: `Order #${order.id} status updated to ${parsed.statusUpdate.status}.` });
  }

  if (parsed.qualityUpdate) {
    const order = db
      .prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?")
      .get(parsed.qualityUpdate.orderId, req.user.userId);
    if (!order) return res.status(404).json({ message: "Order not found for this user." });
    if (order.status !== "Accepted") {
      return res.status(400).json({ message: "Quality updates are allowed only after order is Accepted." });
    }

    db.prepare("INSERT INTO order_notes (order_id, note, created_at) VALUES (?, ?, ?)")
      .run(order.id, parsed.qualityUpdate.note, now);
    db.prepare("INSERT INTO order_history (order_id, event_type, event_value, created_at) VALUES (?, ?, ?, ?)")
      .run(order.id, "quality", parsed.qualityUpdate.note, now);
    return res.json({ reply: `Quality note logged for Order #${order.id}.` });
  }

  if (parsed.listStatus) {
    if (parsed.listStatus.all) {
      const count = db.prepare("SELECT COUNT(*) as c FROM orders WHERE user_id = ?").get(req.user.userId).c;
      return res.json({ reply: `You have ${count} total order(s).`, listStatus: { all: true } });
    }

    const count = db
      .prepare("SELECT COUNT(*) as c FROM orders WHERE user_id = ? AND status = ?")
      .get(req.user.userId, parsed.listStatus.status).c;
    return res.json({
      reply: `You have ${count} ${parsed.listStatus.status.toLowerCase()} order(s).`,
      listStatus: { status: parsed.listStatus.status },
    });
  }

  if (parsed.helpQuery) {
    return res.json({ reply: buildHelpReply(parsed.helpQuery.text) });
  }

  return res.json({
    reply: "I could not parse that. Try creating order, status update, quality update, or list accepted orders.",
  });
});

// JSON 404 for API routes (prevents frontend JSON parsing issues)
app.use((req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.path}` });
});

// JSON error handler (prevents Express HTML stack traces)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error", error: err?.message || "Unknown error" });
});

app.listen(PORT, () => {
  ensureManagerSeed();
  console.log(`Backend running on http://localhost:${PORT}`);
});
