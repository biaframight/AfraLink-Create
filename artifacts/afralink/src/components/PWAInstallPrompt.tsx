import { useState, useEffect, useRef } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Platform = "android" | "ios" | "desktop" | "unknown";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/Macintosh|Windows|Linux/.test(ua)) return "desktop";
  return "unknown";
}

function isRunningStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

const DISMISSED_KEY = "afralink-pwa-dismissed";
const DISMISSED_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // Don't show if already installed
    if (isRunningStandalone()) return;

    // Don't show if dismissed recently
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISSED_TTL) return;

    const plat = detectPlatform();
    setPlatform(plat);

    if (plat === "android" || plat === "desktop") {
      // Listen for Chrome's beforeinstallprompt
      const handler = (e: Event) => {
        e.preventDefault();
        deferredPromptRef.current = e;
        setTimeout(() => setShow(true), 3000);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }

    if (plat === "ios") {
      // iOS Safari: no event, show manual instructions after delay
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    }

    return undefined;
  }, []);

  function handleInstall() {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      deferredPromptRef.current.userChoice.then(() => {
        deferredPromptRef.current = null;
        setShow(false);
      });
    } else if (platform === "ios") {
      setShowIOSSteps(true);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShow(false);
    setShowIOSSteps(false);
  }

  if (!show) return null;

  return (
    <>
      {/* Backdrop for iOS steps modal */}
      {showIOSSteps && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setShowIOSSteps(false)}
        />
      )}

      {/* iOS step-by-step modal */}
      {showIOSSteps && (
        <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-sm mb-4 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Add to Home Screen</h3>
              <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                <span>
                  Tap the <Share className="inline w-4 h-4 text-blue-500 mx-0.5" />
                  <strong> Share</strong> button at the bottom of your browser
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                <span>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>{" "}
                  <Plus className="inline w-4 h-4 mx-0.5" />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                <span>Tap <strong>"Add"</strong> to confirm</span>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 text-xs text-green-700 text-center">
              AfraLink will appear on your home screen like a native app
            </div>
          </div>
        </div>
      )}

      {/* Main install banner (bottom of screen) */}
      {!showIOSSteps && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/10">
            {/* App icon */}
            <img
              src="/icon-192.png"
              alt="AfraLink"
              className="w-12 h-12 rounded-xl flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Install AfraLink</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                {platform === "ios"
                  ? "Add to Home Screen for the best experience"
                  : "Add to your home screen — works offline"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl h-8 px-3 text-xs font-semibold"
              >
                {platform === "ios" ? (
                  <>
                    <Share className="w-3 h-3 mr-1" /> How
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3 mr-1" /> Install
                  </>
                )}
              </Button>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors p-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
