import { useContext } from "react";
import { AppStateContext, type AppState } from "../state/context";

export function useApp(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}
