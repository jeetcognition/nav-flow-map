import { useSyncExternalStore } from "react";
import { subscribeEdits } from "../data/editsService";

let version = 0;
const getVersion = () => version;
const subscribeVersion = (cb: () => void) =>
  subscribeEdits(() => {
    version++;
    cb();
  });

/** re-renders the component whenever the local edits overlay changes */
export function useEditsVersion(): number {
  return useSyncExternalStore(subscribeVersion, getVersion);
}
