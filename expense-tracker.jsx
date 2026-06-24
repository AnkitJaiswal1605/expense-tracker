import { useState, useEffect, useCallback } from "react";

const CATEGORIES = ["Food", "Travel", "Bills", "Other"];

const CATEGORY_ICONS = {
  Food: "🍽️",
  Travel: "✈️",
  Bills: "📄",
  Other: "📦",
};

const CATEGORY_COLORS = {
  Food: "#f59e0b",
  Travel: "#3b82f6",
  Bills: "#8b5cf6",
  Other: "#6b7280",
};

function hashPassword(pass) {
  let h = 0;
  for (let i = 0; i < pass.length; i++) {
    h = (Math.imul(31, h) + pass.charCodeAt(i)) | 0;
  }
  return String(h);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ExpenseTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("Food");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [addError, setAddError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterCat, setFilterCat] = useState("All");

  const storageKey = currentUser ? `expenses:${currentUser.email}` : null;

  const loadExpenses = useCallback(async () => {
    if (!storageKey) return;
    setLoading(true);
    try {
      const result = await window.storage.get(storageKey);
      if (result?.value) setExpenses(JSON.parse(result.value));
      else setExpenses([]);
    } catch {
      setExpenses([]);
    }
    setLoading(false);
  }, [storageKey]);

  const saveExpenses = async (list) => {
    if (!storageKey) return;
    try {
      await window.storage.set(storageKey, JSON.stringify(list));
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  useEffect(() => {
    if (currentUser) loadExpenses();
  }, [currentUser, loadExpenses]);

  const handleAuth = async () => {
    setAuthError("");
    if (!email.trim() || !password.trim()) {
      setAuthError("Please fill in all fields.");
      return;
    }
    if (authMode === "signup" && !name.trim()) {
      setAuthError("Please enter your name.");
      return;
    }
    setAuthLoading(true);
    const userKey = `user:${email.toLowerCase().trim()}`;
    try {
      if (authMode === "signup") {
        try {
          const existing = await window.storage.get(userKey);
          if (existing?.value) {
            setAuthError("An account with this email already exists.");
            setAuthLoading(false);
            return;
          }
        } catch {}
        const userData = { email: email.toLowerCase().trim(), name: name.trim(), passHash: hashPassword(password) };
        await window.storage.set(userKey, JSON.stringify(userData));
        setCurrentUser(userData);
      } else {
        let stored;
        try {
          const result = await window.storage.get(userKey);
          stored = result?.value ? JSON.parse(result.value) : null;
        } catch {
          stored = null;
        }
        if (!stored) {
          setAuthError("No account found. Please sign up first.");
          setAuthLoading(false);
          return;
        }
        if (stored.passHash !== hashPassword(password)) {
          setAuthError("Incorrect password.");
          setAuthLoading(false);
          return;
        }
        setCurrentUser(stored);
      }
    } catch (e) {
      setAuthError("Something went wrong. Try again.");
    }
    setAuthLoading(false);
  };

  const handleAddExpense = async () => {
    setAddError("");
    if (!expName.trim()) { setAddError("Enter a name."); return; }
    if (!expAmount || isNaN(expAmount) || Number(expAmount) <= 0) { setAddError("Enter a valid amount."); return; }
    if (!expDate) { setAddError("Pick a date."); return; }
    const newExp = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: expName.trim(),
      amount: Number(expAmount),
      category: expCategory,
      date: expDate,
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    await saveExpenses(updated);
    setExpName("");
    setExpAmount("");
    setExpCategory("Food");
    setExpDate(new Date().toISOString().split("T")[0]);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setTimeout(async () => {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      await saveExpenses(updated);
      setDeletingId(null);
    }, 300);
  };

  const logout = () => {
    setCurrentUser(null);
    setExpenses([]);
    setEmail("");
    setPassword("");
    setName("");
    setAuthError("");
  };

  const filtered = filterCat === "All" ? expenses : expenses.filter((e) => e.category === filterCat);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  const catTotals = CATEGORIES.map((c) => ({
    cat: c,
    total: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  }));

  // ─── STYLES ───
  const s = {
    app: {
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0a0f 0%, #111118 40%, #0d0d14 100%)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#e8e4df",
      display: "flex",
      justifyContent: "center",
      padding: "20px",
    },
    wrapper: { width: "100%", maxWidth: 520 },
    brand: {
      textAlign: "center",
      padding: "32px 0 24px",
    },
    brandIcon: { fontSize: 28, marginBottom: 6 },
    brandName: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.08em",
      background: "linear-gradient(135deg, #d4af37, #f5d97e, #d4af37)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: 0,
    },
    brandSub: { fontSize: 11, color: "#6b6560", letterSpacing: "0.15em", marginTop: 4, textTransform: "uppercase" },
    card: {
      background: "linear-gradient(145deg, rgba(22,22,30,0.95), rgba(18,18,24,0.98))",
      border: "1px solid rgba(212,175,55,0.12)",
      borderRadius: 16,
      padding: "28px 24px",
      marginBottom: 16,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    },
    cardTitle: { fontSize: 14, fontWeight: 600, color: "#d4af37", marginBottom: 18, letterSpacing: "0.04em" },
    input: {
      width: "100%",
      padding: "12px 14px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      color: "#e8e4df",
      fontSize: 14,
      outline: "none",
      marginBottom: 12,
      boxSizing: "border-box",
      transition: "border-color 0.2s",
    },
    select: {
      width: "100%",
      padding: "12px 14px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      color: "#e8e4df",
      fontSize: 14,
      outline: "none",
      marginBottom: 12,
      boxSizing: "border-box",
      appearance: "none",
    },
    btnPrimary: {
      width: "100%",
      padding: "13px",
      background: "linear-gradient(135deg, #d4af37, #c49b2a)",
      color: "#0a0a0f",
      fontWeight: 700,
      fontSize: 14,
      border: "none",
      borderRadius: 10,
      cursor: "pointer",
      letterSpacing: "0.04em",
      transition: "opacity 0.2s",
    },
    error: { color: "#ef4444", fontSize: 12, marginBottom: 10 },
    link: {
      color: "#d4af37",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 13,
      textDecoration: "underline",
      padding: 0,
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    greeting: { fontSize: 16, fontWeight: 600, color: "#e8e4df" },
    logoutBtn: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      padding: "6px 14px",
      color: "#a09a92",
      fontSize: 12,
      cursor: "pointer",
      fontWeight: 500,
    },
    statRow: { display: "flex", gap: 10, marginBottom: 16 },
    statCard: (color) => ({
      flex: 1,
      background: `linear-gradient(145deg, ${color}10, ${color}05)`,
      border: `1px solid ${color}25`,
      borderRadius: 12,
      padding: "12px 10px",
      textAlign: "center",
    }),
    statLabel: { fontSize: 10, color: "#7a756e", textTransform: "uppercase", letterSpacing: "0.08em" },
    statVal: (color) => ({ fontSize: 16, fontWeight: 700, color, marginTop: 4 }),
    filterRow: { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" },
    filterBtn: (active) => ({
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      border: active ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.08)",
      background: active ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
      color: active ? "#d4af37" : "#7a756e",
      cursor: "pointer",
      transition: "all 0.2s",
    }),
    expItem: (deleting) => ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      opacity: deleting ? 0 : 1,
      transform: deleting ? "translateX(40px)" : "none",
      transition: "opacity 0.3s, transform 0.3s",
    }),
    expIcon: (color) => ({
      width: 38,
      height: 38,
      borderRadius: 10,
      background: `${color}15`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      flexShrink: 0,
    }),
    expInfo: { flex: 1, minWidth: 0 },
    expName: { fontSize: 14, fontWeight: 500, color: "#e8e4df", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    expMeta: { fontSize: 11, color: "#6b6560", marginTop: 3 },
    expAmount: { fontSize: 15, fontWeight: 700, color: "#e8e4df", textAlign: "right", whiteSpace: "nowrap" },
    deleteBtn: {
      background: "none",
      border: "none",
      color: "#6b6560",
      cursor: "pointer",
      padding: 6,
      fontSize: 16,
      borderRadius: 6,
      transition: "color 0.2s",
      flexShrink: 0,
      lineHeight: 1,
    },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    empty: { textAlign: "center", color: "#4a4540", padding: "30px 0", fontSize: 13 },
    total: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 0 4px",
      borderTop: "1px solid rgba(212,175,55,0.15)",
      marginTop: 8,
    },
    totalLabel: { fontSize: 12, color: "#7a756e", textTransform: "uppercase", letterSpacing: "0.06em" },
    totalVal: { fontSize: 20, fontWeight: 700, color: "#d4af37" },
  };

  // ─── AUTH SCREEN ───
  if (!currentUser) {
    return (
      <div style={s.app}>
        <div style={s.wrapper}>
          <div style={s.brand}>
            <div style={s.brandIcon}>💎</div>
            <h1 style={s.brandName}>EXPENDITURE</h1>
            <div style={s.brandSub}>Premium Expense Tracking</div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>{authMode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}</div>
            {authMode === "signup" && (
              <input
                style={s.input}
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            )}
            <input
              style={s.input}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <input
              style={s.input}
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
            {authError && <div style={s.error}>{authError}</div>}
            <button
              style={{ ...s.btnPrimary, opacity: authLoading ? 0.6 : 1 }}
              onClick={handleAuth}
              disabled={authLoading}
            >
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#6b6560" }}>
              {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                style={s.link}
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
              >
                {authMode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN DASHBOARD ───
  return (
    <div style={s.app}>
      <div style={s.wrapper}>
        <div style={s.brand}>
          <div style={s.brandIcon}>💎</div>
          <h1 style={s.brandName}>EXPENDITURE</h1>
        </div>

        <div style={s.topBar}>
          <div style={s.greeting}>Hi, {currentUser.name.split(" ")[0]} 👋</div>
          <button style={s.logoutBtn} onClick={logout}>
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div style={s.statRow}>
          {catTotals.map(({ cat, total }) => (
            <div key={cat} style={s.statCard(CATEGORY_COLORS[cat])}>
              <div style={s.statLabel}>{cat}</div>
              <div style={s.statVal(CATEGORY_COLORS[cat])}>{total > 0 ? formatCurrency(total) : "—"}</div>
            </div>
          ))}
        </div>

        {/* Add Expense */}
        <div style={s.card}>
          <div style={s.cardTitle}>ADD EXPENSE</div>
          <input
            style={s.input}
            placeholder="What did you spend on?"
            value={expName}
            onChange={(e) => setExpName(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
          <div style={s.row2}>
            <input
              style={s.input}
              placeholder="Amount (₹)"
              type="number"
              min="1"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <select style={s.select} value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c]} {c}
                </option>
              ))}
            </select>
          </div>
          <input
            style={s.input}
            type="date"
            value={expDate}
            onChange={(e) => setExpDate(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
          {addError && <div style={s.error}>{addError}</div>}
          <button style={s.btnPrimary} onClick={handleAddExpense}>
            + Add Expense
          </button>
        </div>

        {/* Expense List */}
        <div style={s.card}>
          <div style={s.cardTitle}>
            YOUR EXPENSES{expenses.length > 0 ? ` (${expenses.length})` : ""}
          </div>

          {expenses.length > 0 && (
            <div style={s.filterRow}>
              {["All", ...CATEGORIES].map((c) => (
                <button key={c} style={s.filterBtn(filterCat === c)} onClick={() => setFilterCat(c)}>
                  {c !== "All" ? `${CATEGORY_ICONS[c]} ` : ""}{c}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div style={s.empty}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              {expenses.length === 0 ? "No expenses yet. Add one above!" : "No expenses in this category."}
            </div>
          ) : (
            <>
              {filtered.map((exp) => (
                <div key={exp.id} style={s.expItem(deletingId === exp.id)}>
                  <div style={s.expIcon(CATEGORY_COLORS[exp.category])}>
                    {CATEGORY_ICONS[exp.category]}
                  </div>
                  <div style={s.expInfo}>
                    <div style={s.expName}>{exp.name}</div>
                    <div style={s.expMeta}>
                      {exp.category} · {formatDate(exp.date)}
                    </div>
                  </div>
                  <div style={s.expAmount}>{formatCurrency(exp.amount)}</div>
                  <button
                    style={s.deleteBtn}
                    onClick={() => handleDelete(exp.id)}
                    onMouseEnter={(e) => (e.target.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.target.style.color = "#6b6560")}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div style={s.total}>
                <span style={s.totalLabel}>{filterCat === "All" ? "Total" : `${filterCat} Total`}</span>
                <span style={s.totalVal}>{formatCurrency(totalFiltered)}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", padding: "8px 0 24px", fontSize: 10, color: "#3a3530", letterSpacing: "0.1em" }}>
          EXPENDITURE © 2026
        </div>
      </div>
    </div>
  );
}
