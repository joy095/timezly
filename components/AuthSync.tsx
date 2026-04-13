// components/AuthSync.tsx
import { useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { authStore$ } from "@/stores/authStore";

export function AuthSync() {
  const { data, isPending } = useSession();

  useEffect(() => {
    authStore$.isPending.set(isPending);

    if (!isPending) {
      if (authStore$.user.peek()?.id !== data?.user?.id) {
        authStore$.session.set(data?.session ?? null);
        authStore$.user.set(data?.user ?? null);
      }

      // Fetch and store JWT token
      authClient.token().then((token) => {
        authStore$.token.set(token ?? null);
      });
    }
  }, [isPending, data]);

  return null;
}
