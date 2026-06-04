import { useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, Loader2, Copy, Check } from "lucide-react";
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
  email: z.string().email("Enter a valid email address"),
});

export default function ForgotPassword() {
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to generate reset link"); return; }
      setResetLink(data.resetLink);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    if (!resetLink) return;
    navigator.clipboard.writeText(window.location.origin + resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-white/70 text-sm mt-1">Enter your email to get a reset link</p>
      </div>

      <div className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        {!resetLink ? (
          <>
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send Reset Link
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-semibold text-sm mb-1">Reset link generated!</p>
              <p className="text-green-700 text-xs">
                In a live deployment, this link would be sent to your email. For now, use the link below directly.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Your reset link (valid 1 hour)</p>
              <p className="text-sm text-slate-700 break-all font-mono bg-slate-50 p-3 rounded-lg">
                {window.location.origin}{resetLink}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyLink} className="flex-1">
                  {copied ? <><Check className="w-3 h-3 mr-1.5" /> Copied!</> : <><Copy className="w-3 h-3 mr-1.5" /> Copy link</>}
                </Button>
                <Link href={resetLink} className="flex-1">
                  <Button size="sm" className="w-full">Open reset page →</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
