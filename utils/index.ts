export const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

import { Platform } from "react-native";
import * as Linking from "expo-linking";

export const getCallbackURL = () => {
  return Platform.OS === "web"
    ? window.location.origin + "/(tabs)"
    : Linking.createURL("(tabs)");
};
