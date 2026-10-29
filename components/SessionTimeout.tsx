"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  HEARTBEAT_INTERVAL_MS,
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
  sessionHasExpired,
} from "@/lib/session-policy";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

/** Shared by every tab, so activity in one keeps the others signed in. */
const LAST_ACTIVITY_KEY = "gc:last-activity";
const WARNING_TOAST_ID = "idle-warning";
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;

const readLastActivity = () => {
  try { return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0; } catch { return 0; }
};
const writeLastActivity = (at: number) => {
  try { localStorage.setItem(LAST_ACTIVITY_KEY, String(at)); } catch { /* private mode */ }
};

/**
 * Signs the customer out after IDLE_TIMEOUT_MS without activity, warning
 * first, and when the session reaches its 12-hour limit. While they are
 * active it pings the API now and then so the token's own idle timer, which
 * only counts API requests, keeps pace.
 */
export function SessionTimeout() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const loginAt = session?.loginAt;

  useEffect(() => {
    if (!token) return;

    let ended = false;
    const end = (reason: "idle" | "expired") => {
      if (ended) return;
      ended = true;
      toast.dismiss(WARNING_TOAST_ID);
      signOut({ callbackUrl: `/login?reason=${reason}` });
    };

    // Activity stored before this sign-in belongs to an earlier session.
    const stored = readLastActivity();
    if (stored > (loginAt ?? 0) && Date.now() - stored >= IDLE_TIMEOUT_MS) {
      end("idle");
      return;
    }

    let lastActivity = Date.now();
    let lastWritten = 0;
    let lastHeartbeat = Date.now();
    let warned = false;
    writeLastActivity(lastActivity);

    const markActive = () => {
      lastActivity = Date.now();
      // pointermove fires constantly; storage only needs to be roughly current.
      if (lastActivity - lastWritten > 10_000) {
        writeLastActivity(lastActivity);
        lastWritten = lastActivity;
      }
    };

    const heartbeat = async () => {
      lastHeartbeat = Date.now();
      try {
        const res = await fetch(`${API_URL}/auth/session`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.status === 401) end("expired");
      } catch {
        // Offline: the next tick tries again.
      }
    };

    const tick = () => {
      if (sessionHasExpired(loginAt)) return end("expired");

      const latest = Math.max(lastActivity, readLastActivity());
      const idleFor = Date.now() - latest;

      if (idleFor >= IDLE_TIMEOUT_MS) return end("idle");

      if (idleFor >= IDLE_TIMEOUT_MS - IDLE_WARNING_MS) {
        if (!warned) {
          warned = true;
          toast.warning("You'll be signed out soon because you've been inactive.", {
            id: WARNING_TOAST_ID,
            duration: Infinity,
            action: { label: "Stay signed in", onClick: () => { markActive(); heartbeat(); } },
          });
        }
      } else if (warned) {
        warned = false;
        toast.dismiss(WARNING_TOAST_ID);
      }

      if (latest > lastHeartbeat && Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        heartbeat();
      }
    };

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, markActive, { passive: true }));
    const interval = window.setInterval(tick, 15_000);

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, markActive));
      window.clearInterval(interval);
    };
  }, [token, loginAt]);

  return null;
}
