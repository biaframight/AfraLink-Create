import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Car, Users, Package, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["customer", "driver", "rental_owner"]),
});

const ROLES = [
  { value: "customer", label: "Find transport", icon: Users },
  { value: "driver", label: "Offer transport", icon: Car },
  { value: "rental_owner", label: "Rent my vehicle", icon: Package },
];

export default function LoginPage() {
  const { isAuthenticated, isLoading, refetch } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "/";

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate(next);
  }, [isAuthenticated, isLoading, next, navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", phone: "", role: "customer" },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/local-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-primary px-6 pt-10 pb-8 text-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center font-bold text-xl">A</div>
          <span className="text-xl font-bold tracking-tight">AfraLink</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight">
          {tab === "login" ? "Welcome back" : "Join AfraLink"}
        </h1>
        <p className="text-white/70 text-sm mt-1">
          {tab === "login"
            ? "Sign in to your account"
            : "Transport & logistics across Southern Nigeria"}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 flex">
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); }}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "login" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {tab === "login" ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField control={loginForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={loginForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-12 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>

              <p className="text-center text-sm text-slate-500">
                Don't have an account?{" "}
                <button type="button" onClick={() => setTab("register")} className="text-primary font-semibold hover:underline">
                  Create one free
                </button>
              </p>
            </form>
          </Form>
        ) : (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <FormField control={registerForm.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Emeka Okafor" className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={registerForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={registerForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPw ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        className="h-12 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={registerForm.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone <span className="text-slate-400 font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g. 08012345678" className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={registerForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>I want to</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                          field.value === value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")} className="text-primary font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
