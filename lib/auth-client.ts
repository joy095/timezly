import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { BACKEND_URL } from "@/const";
import {
  adminClient,
  organizationClient,
  emailOTPClient,
  jwtClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: BACKEND_URL, // Base URL of Better Auth backend.
  plugins: [
    expoClient({
      scheme: "myapp",
      storagePrefix: "myapp",
      storage: SecureStore,
    }),

    adminClient(),
    organizationClient(),
    jwtClient(),
    emailOTPClient(),
  ],
});
