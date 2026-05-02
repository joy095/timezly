// components/AuthSync.tsx
import { useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { authStore$ } from "@/stores/authStore";
import type { OrgListResponse } from "@/types/auth";

export function AuthSync() {
  const { data, isPending } = useSession();

  useEffect(() => {
    let mounted = true;

    authStore$.isPending.set(isPending);

    if (!isPending) {
      const currentUserId = authStore$.user.peek()?.id;
      const newUserId = data?.user?.id;

      // Update session/user only if changed
      if (currentUserId !== newUserId) {
        authStore$.session.set(data?.session ?? null);
        authStore$.user.set(data?.user ?? null);
      }

      // Token fetch
      authClient.token().then((token) => {
        if (mounted) {
          authStore$.token.set(token ?? null);
        }
      });

      // Organization fetch + normalization
      authClient.organization
        .list()
        .then((res: OrgListResponse) => {
          if (!mounted) return;

          const orgs = res?.data ?? [];

          authStore$.organizations.set(orgs);
          authStore$.organization.set(orgs[0] ?? null); // active org
        })
        .catch(() => {
          if (!mounted) return;

          authStore$.organizations.set([]);
          authStore$.organization.set(null);
        });
    }

    return () => {
      mounted = false;
    };
  }, [isPending, data?.user?.id]);

  return null;
}
