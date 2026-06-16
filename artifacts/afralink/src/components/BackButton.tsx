import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const FALLBACKS: Array<{ pattern: RegExp; fallback: string }> = [
  { pattern: /^\/drivers\//, fallback: "/drivers" },
  { pattern: /^\/rentals\//, fallback: "/rentals" },
  { pattern: /^\/driver-dashboard/, fallback: "/" },
  { pattern: /^\/become-driver/, fallback: "/" },
  { pattern: /^\/list-vehicle/, fallback: "/" },
  { pattern: /^\/dashboard/, fallback: "/" },
  { pattern: /^\/profile/, fallback: "/" },
  { pattern: /^\/admin/, fallback: "/" },
  { pattern: /^\/drivers/, fallback: "/" },
  { pattern: /^\/rentals/, fallback: "/" },
];

const LABELS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^\/drivers\//, label: "Back to Drivers" },
  { pattern: /^\/rentals\//, label: "Back to Rentals" },
  { pattern: /^\/drivers/, label: "Back to Home" },
  { pattern: /^\/rentals/, label: "Back to Home" },
  { pattern: /^\/become-driver/, label: "Back to Home" },
  { pattern: /^\/list-vehicle/, label: "Back to Home" },
  { pattern: /^\/driver-dashboard/, label: "Back to Home" },
  { pattern: /^\/dashboard/, label: "Back to Home" },
  { pattern: /^\/profile/, label: "Back" },
  { pattern: /^\/admin/, label: "Back to Home" },
];

export function BackButton() {
  const [location, navigate] = useLocation();

  const fallback = FALLBACKS.find(r => r.pattern.test(location))?.fallback ?? "/";
  const label = LABELS.find(r => r.pattern.test(location))?.label ?? "Back";

  const handleBack = () => {
    if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate(fallback);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 -ml-2 h-9 px-3 rounded-lg text-sm font-medium"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}
