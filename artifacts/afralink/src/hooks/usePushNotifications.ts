import { useEffect, useRef, useState } from "react";

const SW_SCOPE = "/";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(isAuthenticated: boolean) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const subscribed = useRef(false);

  const subscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!isAuthenticated) return;

    try {
      // Ask permission
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;

      // Get VAPID public key
      const keyRes = await fetch("/api/push/vapid-public-key");
      if (!keyRes.ok) return;
      const { publicKey } = await keyRes.json() as { publicKey: string };
      if (!publicKey) return;

      // Get SW registration
      const reg = await navigator.serviceWorker.ready;

      // Subscribe
      const existing = await reg.pushManager.getSubscription();
      let sub = existing;
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as string,
        });
      }

      // Send subscription to server
      const subJson = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          expirationTime: sub.expirationTime,
          keys: subJson.keys,
        }),
      });

      subscribed.current = true;
    } catch {
      // silently ignore — push is non-critical
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (subscribed.current) return;
    if (!("serviceWorker" in navigator)) return;

    // Auto-subscribe if already granted; otherwise wait for user interaction
    if (Notification.permission === "granted") {
      subscribe();
    }
  }, [isAuthenticated]);

  return { permission, subscribe };
}
