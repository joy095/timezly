import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { IMAGE_URL } from "@/const";

export const getCallbackURL = () => {
  return Platform.OS === "web"
    ? window.location.origin + "/(user-tabs)"
    : Linking.createURL("(user-tabs)");
};

export const getAvatarUrl = (image?: string | null) => {
  if (!image) return null;

  // If already a full URL (Google, GitHub, etc.)
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // Otherwise it's your stored path → prepend your base URL
  return `${IMAGE_URL}/${image}`;
};
