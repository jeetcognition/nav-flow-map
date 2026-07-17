import { createContext } from "react";
import type { Surface, User } from "../types";

export interface AppState {
  user: User;
  setUserId: (id: string) => void;
  surface: Surface;
  setSurfaceId: (id: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const AppStateContext = createContext<AppState | null>(null);
