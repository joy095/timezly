import { ThemeProvider } from "@react-navigation/native";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Provider as PaperProvider } from "react-native-paper";

import { useAppTheme } from "@/theme/ThemeContext";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (err) => {
      console.error("[Mutation error]", err);
    },
  }),

  queryCache: new QueryCache({
    onError: (err) => {
      console.error("[Query error]", err);
    },
  }),

  defaultOptions: {
    queries: {
      retry: true,
      staleTime: 1000 * 60,
    },
    mutations: {
      retry: false,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { navTheme } = useAppTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={navTheme}>
        <ThemeProvider value={navTheme}>{children}</ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
