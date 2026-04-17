import { BACKEND_URL, AUTH_URL } from "@/const";
import { useAppTheme } from "@/theme/ThemeContext";
import useAppColors from "@/theme/useAppColors";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
  const colors = useAppColors();
  const { toggleTheme, theme } = useAppTheme();
  const router = useRouter();

  const [backendResponse, setBackendResponse] = useState<string>("Loading...");
  const [backendError, setBackendError] = useState<string | null>(null);

  const [authResponse, setAuthResponse] = useState<string>("Loading...");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const testBackendApi = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/`);

        const data = await res.json();
        setBackendResponse(JSON.stringify(data));
      } catch (err: any) {
        console.log("API ERROR:", err);
        setBackendError(err.message);
      }
    };

    const testAuthApi = async () => {
      try {
        const res = await fetch(`${AUTH_URL}/`);

        const data = await res.json();
        setAuthResponse(JSON.stringify(data));
      } catch (err: any) {
        console.error("API ERROR:", err);
        setAuthError(err.message);
      }
    };

    testAuthApi();
    testBackendApi();
  }, []);

  return (
    // <AppContainer>
    //   <Text style={{ color: colors.text, marginBottom: 20 }}>
    //     Current Theme: {theme}
    //   </Text>

    //   <AppButton title="Toggle Theme" onPress={toggleTheme} />
    //   <AppButton title="Login" onPress={() => router.push("/login")} />

    //   <AppButton title="Home tab" onPress={() => router.navigate("/(user-tabs)")} />

    //   {/* API RESULT */}
    //   <Text style={{ color: colors.text, marginTop: 20 }}>
    //     API Response from main backend: {backendResponse}
    //   </Text>

    //   {/* ERROR */}
    //   {backendError && (
    //     <Text style={{ color: "red", marginTop: 10 }}>
    //       Error: {backendError}
    //     </Text>
    //   )}

    //   {/* API RESULT */}
    //   <Text style={{ color: colors.text, marginTop: 20 }}>
    //     API Response from auth backend: {authResponse}
    //   </Text>

    //   {/* ERROR */}
    //   {authError && (
    //     <Text style={{ color: "red", marginTop: 10 }}>Error: {authError}</Text>
    //   )}
    // </AppContainer>

    <Redirect href="/welcome" />
  );
}
