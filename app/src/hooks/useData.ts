import { useSyncExternalStore } from "react";
import { subscribe } from "../data/dataService";

let version = 0;
const getVersion = () => version;
const subscribeVersion = (cb: () => void) =>
  subscribe(() => {
    version++;
    cb();
  });

/** re-renders the component whenever the mock data store mutates */
export function useDataVersion(): number {
  return useSyncExternalStore(subscribeVersion, getVersion);
}
