import { Platform } from "react-native";
import * as Linking from "expo-linking";

export const getCallbackURL = () => {
  return Platform.OS === "web"
    ? window.location.origin + "/(tabs)"
    : Linking.createURL("(tabs)");
};

export const getAvatarUrl = (image?: string | null) => {
  if (!image) return null;

  // If already a full URL (Google, GitHub, etc.)
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // Otherwise it's your stored path → prepend your base URL
  return `${process.env.EXPO_PUBLIC_IMAGE_BASE_URL}/${image}`;
};
