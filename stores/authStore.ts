import { observable } from "@legendapp/state";
import type { Session, User } from "better-auth";

type AuthState = {
  isPending: boolean;
  session: Session | null;
  user: User | null;
  token: string | null;
};

export const authStore$ = observable<AuthState>({
  isPending: true,
  session: null,
  user: null,
  token: null,
});
