// store/clock.ts
import { observable } from "@legendapp/state";

export const now$ = observable(Date.now());

const intervalId = setInterval(() => {
   now$.set(Date.now());
 }, 1000);

export function stopClock() {
  clearInterval(intervalId);
}

