import { useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { authStore$ } from "@/stores/authStore";
import type { Doctor, OrgListResponse } from "@/types/auth";

export function AuthSync() {
  const { data, isPending } = useSession();

  useEffect(() => {
    let mounted = true;

    authStore$.isPending.set(isPending);

    async function sync() {
      if (isPending) return;

      const currentUserId = authStore$.user.peek()?.id;
      const newUserId = data?.user?.id;

      // Update session/user only if changed
      if (currentUserId !== newUserId) {
        authStore$.session.set(data?.session ?? null);
        authStore$.user.set(data?.user ?? null);
      }

      // Token fetch
      const token = await authClient.token();

      if (mounted) {
        authStore$.token.set(token ?? null);
      }

      try {
        // Organizations
        const res: OrgListResponse = await authClient.organization.list();

        if (!mounted) return;

        const orgs = res?.data ?? [];
        const activeOrg = orgs[0] ?? null;

        authStore$.organizations.set(orgs);
        authStore$.organization.set(activeOrg);

        // Doctor fetch
        if (activeOrg?.slug) {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/doctor/${activeOrg.slug}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.ok) {
            const doctor: Doctor = await response.json();

            if (mounted) {
              authStore$.doctor.set(doctor);
            }
          } else {
            authStore$.doctor.set(null);
          }
        } else {
          authStore$.doctor.set(null);
        }
      } catch (error) {
        if (!mounted) return;

        authStore$.organizations.set([]);
        authStore$.organization.set(null);
        authStore$.doctor.set(null);

        if (__DEV__) {
          console.error("[AuthSync]", error);
        }
      }
    }

    sync();

    return () => {
      mounted = false;
    };
  }, [isPending, data?.user?.id]);

  return null;
}
