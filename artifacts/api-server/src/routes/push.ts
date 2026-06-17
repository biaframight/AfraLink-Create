import { Router, type IRouter } from "express";
import webpush from "web-push";
import { db, pushSubscriptionsTable, bookingsTable, driversTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_EMAIL = "mailto:alphuplift@gmail.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// GET /api/push/vapid-public-key — client fetches this to subscribe
router.get("/push/vapid-public-key", (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe — save a push subscription for the current user
router.post("/push/subscribe", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { endpoint, keys, expirationTime } = req.body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription object" });
    return;
  }

  await db
    .insert(pushSubscriptionsTable)
    .values({
      userId: req.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      expirationTime: expirationTime ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: {
        userId: req.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        expirationTime: expirationTime ?? null,
        updatedAt: new Date(),
      },
    });

  res.json({ ok: true });
});

// POST /api/push/unsubscribe — remove a subscription
router.post("/push/unsubscribe", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { endpoint } = req.body ?? {};
  if (!endpoint) {
    res.status(400).json({ error: "endpoint required" });
    return;
  }

  await db
    .delete(pushSubscriptionsTable)
    .where(
      and(
        eq(pushSubscriptionsTable.userId, req.user.id),
        eq(pushSubscriptionsTable.endpoint, endpoint),
      ),
    );

  res.json({ ok: true });
});

// Helper: send a push notification to all subscriptions for a user
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; icon?: string },
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const subs = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, userId));

  const payloadStr = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    icon: payload.icon ?? "/icon-192.png",
    badge: "/icon-192.png",
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr,
        );
      } catch {
        // Subscription expired — clean it up
        await db
          .delete(pushSubscriptionsTable)
          .where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
      }
    }),
  );
}

export default router;
