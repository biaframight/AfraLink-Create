import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Car, Users, Package, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES = [
  { value: "customer", label: "Book a Ride", icon: Users },
  { value: "driver", label: "Offer transport", icon: Car },
  { value: "rental_owner", label: "Rent my vehicle", icon: Package },
] as const;

type Role = "customer" | "driver" | "rental_owner";

export default function LoginPage() {
  const { isAuthenticated, isLoading, refetch } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPw, setRegPw] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regRole, setRegRole] = useState<Role>("customer");
  const [showRegPw, setShowRegPw] = useState(false);

  const firstRegInputRef = useRef<HTMLInputElement>(null);

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "/";

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate(next);
  }, [isAuthenticated, isLoading, next, navigate]);

  useEffect(() => {
    if (tab === "register") {
      setTimeout(() => firstRegInputRef.current?.focus(), 50);
    }
  }, [tab]);

  const switchTab = (t: "login" | "register") => {
    setTab(t);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginEmail) { setError("Email is required"); return; }
    if (!loginPw) { setError("Password is required"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      await refetch();
      navigate(next);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!regName || regName.length < 2) { setError("Enter your full name"); return; }
    if (!regEmail || !regEmail.includes("@")) { setError("Enter a valid email"); return; }
    if (!regPw || regPw.length < 6) { setError("Password must be at least 6 characters"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/local-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: regName, email: regEmail, password: regPw, phone: regPhone, role: regRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      await refetch();
      navigate(next);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full h-12 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-primary px-6 pt-10 pb-8 text-white">
        <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center font-bold text-xl">A</div>
          <span className="text-xl font-bold tracking-tight">AfraLink</span>
        </Link>
        <h1 className="text-2xl font-bold leading-tight">
          {tab === "login" ? "Welcome back" : "Join AfraLink"}
        </h1>
        <p className="text-white/70 text-sm mt-1">
          {tab === "login" ? "Sign in to your account" : "Transport & logistics across Southern Nigeria"}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 flex">
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
              tab === t ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "login" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full overflow-y-auto">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ── SIGN IN ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showLoginPw ? "text" : "password"}
                  value={loginPw}
                  onChange={e => setLoginPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Sign In
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="text-slate-500 hover:text-primary">
                Forgot password?
              </Link>
              <span className="text-slate-500">
                No account?{" "}
                <button type="button" onClick={() => switchTab("register")} className="text-primary font-semibold hover:underline">
                  Sign up free
                </button>
              </span>
            </div>
          </form>
        )}

        {/* ── CREATE ACCOUNT ── */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                ref={firstRegInputRef}
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="e.g. Emeka Okafor"
                autoComplete="name"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showRegPw ? "text" : "password"}
                  value={regPw}
                  onChange={e => setRegPw(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                autoComplete="tel"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">I want to</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRegRole(value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                      regRole === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Account
            </Button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button type="button" onClick={() => switchTab("login")} className="text-primary font-semibold hover:underline">
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
