// store/otpTimerStore.ts
import { observable } from "@legendapp/state";
import { now$ } from "./clock";

export const otpTimerState = observable({
  timers: {} as Record<string, { expiresAt: number | null }>,
});

export const getRemainingSeconds = (email: string): number | null => {
  const entry = otpTimerState.timers[email].get();
  const now = now$.get(); // 🔥 reactive dependency

  if (!entry || entry.expiresAt === null) return null;

  const remaining = Math.ceil((entry.expiresAt - now) / 1000);
  return Math.max(0, remaining);
};
