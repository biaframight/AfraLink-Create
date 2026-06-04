import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Car, Users, Package, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "/";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation(next);
    }
  }, [isAuthenticated, isLoading, next, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="flex items-center gap-3 p-6 pt-8">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg">
          A
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">AfraLink</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs px-3 py-1.5 rounded-full mb-4">
              <MapPin className="w-3 h-3" />
              Southern Nigeria's #1 Transport Hub
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
              Find transport &amp; logistics you can trust
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connect directly with verified drivers, car rental owners, and logistics operators — no middlemen, no hidden fees.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { icon: Users, title: "Verified Drivers", desc: "Keke, taxi, motorcycle, buses & trucks" },
              { icon: Car, title: "Car Rentals", desc: "Self-drive or chauffeur, daily or monthly" },
              { icon: Package, title: "Logistics", desc: "Deliveries across Southern Nigeria" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 bg-white/5 rounded-xl p-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{title}</div>
                  <div className="text-slate-400 text-xs">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => login()}
            className="w-full h-13 bg-primary hover:bg-primary/90 text-white font-semibold text-base rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            disabled={isLoading}
            style={{ height: "52px" }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading…
              </span>
            ) : (
              <>
                Sign in / Register
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-slate-500 text-xs text-center mt-4 leading-relaxed">
            New to AfraLink? Signing in automatically creates your free account.
            No credit card required.
          </p>
        </div>
      </div>

      <div className="p-6 text-center">
        <p className="text-slate-600 text-xs">
          Serving Rivers · Lagos · Delta · Anambra · Cross River · Akwa Ibom &amp; more
        </p>
      </div>
    </div>
  );
}
