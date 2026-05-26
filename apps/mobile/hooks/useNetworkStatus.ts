import { useEffect, useState, useRef } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline((prev) => {
        if (!online) setWasOffline(true);
        return online;
      });
    });

    // Vérifier aussi au retour en premier plan
    const appSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        NetInfo.fetch().then((s) => {
          setIsOnline(!!(s.isConnected && s.isInternetReachable !== false));
        });
      }
    });

    return () => { unsub(); appSub.remove(); };
  }, []);

  return { isOnline, wasOffline };
}
