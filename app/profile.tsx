import { AppContainer } from "@/components/ui";
import { getToken } from "@/lib/secureStore";
import { useEffect, useState } from "react";
import { Text } from "react-native";

export default function ProfileScreen() {
  useEffect(() => {
    const loadToken = async () => {
      const t = await getToken();
      console.log("TOKEN:", t);
      setToken(t); // store in state
    };

    loadToken();
  }, []);

  const [token, setToken] = useState<string | null>(null);

  return (
    <AppContainer>
      <Text>{token ? `Profile: ${token}` : "No token found"}</Text>
    </AppContainer>
  );
}
