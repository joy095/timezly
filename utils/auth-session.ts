import * as SecureStore from "expo-secure-store";

// ─── Key Constants ────────────────────────────────────────────────────────────
const KEYS = {
  SESSION_TOKEN: "better_auth_session_token",
  SESSION_DATA: "better_auth_session_data",
  JWT_ACCESS: "better_auth_jwt_access",
  JWT_REFRESH: "better_auth_jwt_refresh",
  JWT_EXPIRY: "better_auth_jwt_expiry",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SessionData {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp in ms
}

export interface StoredAuth {
  session: SessionData | null;
  sessionToken: string | null;
  tokens: AuthTokens | null;
}

// ─── SecureStore Options ──────────────────────────────────────────────────────
// requireAuthentication: true forces biometric/PIN on access (optional, stricter)
const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// ─── Low-level helpers ────────────────────────────────────────────────────────
async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, STORE_OPTIONS);
}

async function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key, STORE_OPTIONS);
}

async function deleteItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key, STORE_OPTIONS);
}

// ─── Session Storage ──────────────────────────────────────────────────────────

/**
 * Save the raw session token string returned by Better Auth.
 */
export async function saveSessionToken(token: string): Promise<void> {
  await setItem(KEYS.SESSION_TOKEN, token);
}

/**
 * Retrieve the stored session token.
 */
export async function getSessionToken(): Promise<string | null> {
  return getItem(KEYS.SESSION_TOKEN);
}

/**
 * Save the full session object (id, userId, expiresAt, etc.).
 */
export async function saveSessionData(session: SessionData): Promise<void> {
  await setItem(KEYS.SESSION_DATA, JSON.stringify(session));
}

/**
 * Retrieve and parse the stored session object.
 */
export async function getSessionData(): Promise<SessionData | null> {
  const raw = await getItem(KEYS.SESSION_DATA);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Check if the stored session is still valid (not expired).
 */
export async function isSessionValid(): Promise<boolean> {
  const session = await getSessionData();
  if (!session?.expiresAt) return false;
  return new Date(session.expiresAt).getTime() > Date.now();
}

// ─── JWT Storage ──────────────────────────────────────────────────────────────

/**
 * Save access token, optional refresh token, and optional expiry.
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await setItem(KEYS.JWT_ACCESS, tokens.accessToken);

  if (tokens.refreshToken) {
    await setItem(KEYS.JWT_REFRESH, tokens.refreshToken);
  }

  if (tokens.expiresAt !== undefined) {
    await setItem(KEYS.JWT_EXPIRY, String(tokens.expiresAt));
  }
}

/**
 * Retrieve the stored access token.
 */
export async function getAccessToken(): Promise<string | null> {
  return getItem(KEYS.JWT_ACCESS);
}

/**
 * Retrieve the stored refresh token.
 */
export async function getRefreshToken(): Promise<string | null> {
  return getItem(KEYS.JWT_REFRESH);
}

/**
 * Check if the stored access token is expired.
 * Returns true if expired or expiry unknown.
 */
export async function isAccessTokenExpired(): Promise<boolean> {
  const expiryRaw = await getItem(KEYS.JWT_EXPIRY);
  if (!expiryRaw) {
    // No expiry stored — try decoding from the JWT itself
    const token = await getAccessToken();
    if (!token) return true;
    const payload = decodeJWTPayload(token);
    if (!payload?.exp) return true;
    return payload.exp * 1000 < Date.now();
  }
  return Number(expiryRaw) < Date.now();
}

/**
 * Decode JWT payload without verifying the signature (client-side only).
 * Never trust this for authorization — always verify server-side.
 */
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Combined helpers ─────────────────────────────────────────────────────────

/**
 * Save everything returned after a Better Auth login in one call.
 *
 * @example
 * const result = await authClient.signIn.email({ email, password });
 * await saveAuth({
 *   sessionToken: result.data.session.token,
 *   sessionData:  result.data.session,
 *   tokens: {
 *     accessToken:  result.data.token,           // JWT if using JWT plugin
 *     refreshToken: result.data.refreshToken,
 *     expiresAt:    result.data.session.expiresAt
 *       ? new Date(result.data.session.expiresAt).getTime()
 *       : undefined,
 *   },
 * });
 */
export async function saveAuth(params: {
  sessionToken?: string;
  sessionData?: SessionData;
  tokens?: AuthTokens;
}): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (params.sessionToken) tasks.push(saveSessionToken(params.sessionToken));
  if (params.sessionData) tasks.push(saveSessionData(params.sessionData));
  if (params.tokens) tasks.push(saveTokens(params.tokens));

  await Promise.all(tasks);
}

/**
 * Read all stored auth data in one call.
 */
export async function getAuth(): Promise<StoredAuth> {
  const [sessionToken, sessionData, accessToken, refreshToken, expiryRaw] =
    await Promise.all([
      getItem(KEYS.SESSION_TOKEN),
      getItem(KEYS.SESSION_DATA),
      getItem(KEYS.JWT_ACCESS),
      getItem(KEYS.JWT_REFRESH),
      getItem(KEYS.JWT_EXPIRY),
    ]);

  return {
    sessionToken,
    session: sessionData ? (JSON.parse(sessionData) as SessionData) : null,
    tokens: accessToken
      ? {
          accessToken,
          refreshToken: refreshToken ?? undefined,
          expiresAt: expiryRaw ? Number(expiryRaw) : undefined,
        }
      : null,
  };
}

/**
 * Clear all stored auth data (call on sign-out).
 */
export async function clearAuth(): Promise<void> {
  await Promise.all(Object.values(KEYS).map(deleteItem));
}

// ─── React hook (optional) ────────────────────────────────────────────────────
// Uncomment if you want a hook-based API in your components.

/*
import { useState, useEffect, useCallback } from "react";

export function useSecureAuth() {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAuth();
    setAuth(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (params: Parameters<typeof saveAuth>[0]) => {
    await saveAuth(params);
    await load();
  }, [load]);

  const clear = useCallback(async () => {
    await clearAuth();
    setAuth(null);
  }, []);

  return { auth, loading, save, clear, reload: load };
}
*/
