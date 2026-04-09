// components/AuthSync.tsx
import { useSession } from "@/lib/auth-client"
import { authStore$ } from "@/stores/authStore"

export function AuthSync() {
  const { data, isPending } = useSession()

  authStore$.isPending.set(isPending)

  if (!isPending) {
    // Only write if value actually changed
    if (authStore$.user.peek()?.id !== data?.user?.id) {
      authStore$.session.set(data?.session ?? null)
      authStore$.user.set(data?.user ?? null)
    }
  }

  return null
}