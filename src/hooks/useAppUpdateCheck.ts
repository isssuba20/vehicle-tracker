import { useEffect, useState } from "react";
import * as Updates from "expo-updates";

export type UpdateCheckState = "idle" | "checking" | "ready" | "none" | "error";

/**
 * Silently checks for and downloads an OTA update once, shortly after
 * launch — the existing "Check for updates" button in Settings does the
 * same thing but only when the user remembers to tap it. This never
 * auto-restarts the app: `state` only reaches "ready" once a new bundle
 * has already been fetched, and it's up to the UI (UpdateBanner) to ask
 * before calling Updates.reloadAsync().
 */
export function useAppUpdateCheck() {
  const [state, setState] = useState<UpdateCheckState>("idle");

  useEffect(() => {
    if (!Updates.isEnabled) return;

    let cancelled = false;
    (async () => {
      setState("checking");
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) {
          if (!cancelled) setState("none");
          return;
        }
        const fetched = await Updates.fetchUpdateAsync();
        if (!cancelled) setState(fetched.isNew ? "ready" : "none");
      } catch {
        // Best-effort: no network, update server unreachable, etc. — the
        // manual "Check for updates" button in Settings still works and
        // surfaces the error there; this silent background pass just
        // gives up quietly rather than interrupting app launch.
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
