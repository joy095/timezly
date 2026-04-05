import { AppButton, AppContainer } from "@/components/ui";
import { BACKEND_URL } from "@/const";
import { useAppTheme } from "@/theme/ThemeContext";
import useAppColors from "@/theme/useAppColors";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";

export default function Index() {
  const colors = useAppColors();
  const { toggleTheme, theme } = useAppTheme();
  const router = useRouter();

  const [response, setResponse] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);

  const BASE_URL = BACKEND_URL;

  useEffect(() => {
    const testApi = async () => {
      try {
        const res = await fetch(`${BASE_URL}/`);

        const data = await res.json();
        setResponse(JSON.stringify(data));
      } catch (err: any) {
        console.log("API ERROR:", err);
        setError(err.message);
      }
    };

    testApi();
  }, []);

  return (
    <AppContainer>
      <Text style={{ color: colors.text, marginBottom: 20 }}>
        Current Theme: {theme}
      </Text>

      <AppButton title="Toggle Theme" onPress={toggleTheme} />
      <AppButton title="Login" onPress={() => router.navigate("/login")} />

      <AppButton
        title="Home tab"
        onPress={() => router.navigate("/(tabs)")}
      />

      <AppButton
        title="About tab"
        onPress={() => router.navigate("/(tabs)/about")}
      />

      {/* API RESULT */}
      <Text style={{ color: colors.text, marginTop: 20 }}>
        API Response: {response}
      </Text>

      {/* ERROR */}
      {error && (
        <Text style={{ color: "red", marginTop: 10 }}>Error: {error}</Text>
      )}

      <Text style={{ color: colors.success, marginTop: 20 }}>
        Success Color Example
      </Text>
    </AppContainer>
  );
}
