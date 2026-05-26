import { AuthState } from "@/types/auth";
import { observable } from "@legendapp/state";

export const authStore$ = observable<AuthState>({
  isPending: true,
  session: null,
  user: null,
  token: null,
  organization: null,
  organizations: [],
  doctor: null,
});
