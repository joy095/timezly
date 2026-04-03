// store/clock.ts
import { observable } from "@legendapp/state";

export const now$ = observable(Date.now());

setInterval(() => {
  now$.set(Date.now());
}, 1000);
