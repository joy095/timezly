import { observable } from "@legendapp/state"
import type { Session, User } from "better-auth"

interface AuthState {
  session: Session | null
  user: User | null
  isPending: boolean
}

export const authStore$ = observable<AuthState>({
  session: null,
  user: null,
  isPending: true,
})