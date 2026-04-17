import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { AUTH_URL } from "@/const";
import {
  organizationClient,
  emailOTPClient,
  jwtClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: AUTH_URL, // Base URL of Better Auth backend.
  plugins: [
    expoClient({
      scheme: "timezly",
      storagePrefix: "timezly",
      storage: SecureStore,
    }),

    organizationClient(),
    jwtClient(),
    emailOTPClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, organization } = authClient;
