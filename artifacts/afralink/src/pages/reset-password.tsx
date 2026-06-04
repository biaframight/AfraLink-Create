import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
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

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-slate-600">Invalid or missing reset token.</p>
          <Link href="/forgot-password">
            <Button variant="outline">Request a new reset link</Button>
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); return; }
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-primary px-6 pt-10 pb-8 text-white">
        <Link href="/login">
          <button className="flex items-center gap-2 text-white/70 hover:text-white mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
        </Link>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center font-bold text-xl">A</div>
          <span className="text-xl font-bold tracking-tight">AfraLink</span>
        </div>
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="text-white/70 text-sm mt-1">Choose a strong password for your account</p>
      </div>

      <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        {done ? (
          <div className="text-center space-y-4 pt-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Password updated!</h2>
            <p className="text-slate-500">Redirecting you to the login page…</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          className="h-12 pr-10"
                          {...field}
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="confirm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input type={showPw ? "text" : "password"} placeholder="Repeat password" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
