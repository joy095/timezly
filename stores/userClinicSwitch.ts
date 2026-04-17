import { observable } from "@legendapp/state";
import {
  persistObservable,
  configureObservablePersistence,
} from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { Platform } from "react-native";

export const appMode$ = observable({
  activeMode: "user",
});

export async function initPersistence() {
  if (Platform.OS === "web") {
    // Web: use localStorage (window is guaranteed available here)
    configureObservablePersistence({
      pluginLocal: ObservablePersistLocalStorage,
    });
  } else {
    // Native: use AsyncStorage
    const { ObservablePersistAsyncStorage } =
      await import("@legendapp/state/persist-plugins/async-storage");
    const { default: AsyncStorage } =
      await import("@react-native-async-storage/async-storage");
    configureObservablePersistence({
      pluginLocal: ObservablePersistAsyncStorage,
      localOptions: { asyncStorage: { AsyncStorage } },
    });
  }

  persistObservable(appMode$, { local: "app_view_mode" });
}
