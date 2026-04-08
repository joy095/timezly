import { authClient } from "@/lib/auth-client";
import { clearAuth, decodeJWTPayload, getAccessToken, getAuth, isAccessTokenExpired, isSessionValid, saveAuth } from "./auth-session";

// ─── Sign In ──────────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const result = await authClient.signIn.email({ email, password });

  if (result.error) throw new Error(result.error.message);

  const { session, token } = result.data; // token = JWT if JWT plugin enabled

  await saveAuth({
    sessionToken: session.token, // raw session cookie value
    sessionData: {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    },
    tokens: token
      ? {
          accessToken: token,
          // refreshToken: result.data.refreshToken,  // if your setup returns one
          expiresAt: new Date(session.expiresAt).getTime(),
        }
      : undefined,
  });

  return result.data;
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut() {
  await authClient.signOut();
  await clearAuth();
}

// ─── Bootstrap (app start) ────────────────────────────────────────────────────
export async function bootstrapAuth() {
  const auth = await getAuth();

  if (!auth.session && !auth.sessionToken) {
    // Nothing stored — user must log in
    return { authenticated: false };
  }

  // Check session expiry
  const sessionOk = await isSessionValid();
  if (!sessionOk) {
    await clearAuth();
    return { authenticated: false };
  }

  // Optionally check JWT expiry
  if (auth.tokens) {
    const expired = await isAccessTokenExpired();
    if (expired) {
      // Attempt token refresh or clear and redirect to login
      // await refreshAccessToken();
      console.warn("Access token expired");
    }
  }

  return { authenticated: true, auth };
}

// ─── Authenticated fetch helper ───────────────────────────────────────────────
export async function authedFetch(url: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const expired = await isAccessTokenExpired();

  if (!token || expired) {
    throw new Error("No valid access token — please sign in again.");
  }

  // Decode without trusting (just for logging/display, never for authz)
  const payload = decodeJWTPayload(token);
  console.log("Making request as userId:", payload?.sub);

  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

// ─── Example component usage ──────────────────────────────────────────────────
/*
import { useEffect } from "react";
import { useRouter } from "expo-router";
 
export default function App() {
  const router = useRouter();
 
  useEffect(() => {
    bootstrapAuth().then(({ authenticated }) => {
      router.replace(authenticated ? "/(tabs)" : "/login");
    });
  }, []);
 
  return null;
}
*/
