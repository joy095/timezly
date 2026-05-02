import { ThemeProvider } from "@react-navigation/native";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  onlineManager,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Provider as PaperProvider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useState } from "react";

import { useAppTheme } from "@/theme/ThemeContext";

// --- Splash ---
SplashScreen.preventAutoHideAsync();

// --- Notifications ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function notify(title: string, body?: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

// --- Online manager ---
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && !!state.isInternetReachable);
  });
});

// --- QueryClient ---
export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (err, _vars, _ctx, mutation) => {
      const label =
        (mutation.meta?.errorMessage as string) ?? "Something went wrong";
      notify("Error", label);
      if (__DEV__) console.error("[MutationCache]", err);
    },
  }),
  queryCache: new QueryCache({
    onError: (err, query) => {
      if (query.state.data !== undefined) {
        notify("Failed to refresh data");
      }
      if (__DEV__) console.error("[QueryCache]", err);
    },
  }),
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// --- Persister ---
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

// --- Providers ---
export function AppProviders({ children }: { children: React.ReactNode }) {
  const { navTheme } = useAppTheme();
  const [isReady, setIsReady] = useState(false);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: "v1",
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === "success",
        },
      }}
      onSuccess={() => {
        setIsReady(true);
        SplashScreen.hideAsync();
      }}
    >
      {isReady ? (
        <PaperProvider theme={navTheme}>
          <ThemeProvider value={navTheme}>{children}</ThemeProvider>
        </PaperProvider>
      ) : null}
    </PersistQueryClientProvider>
  );
}
