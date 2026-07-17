import { useMemo, useState, type ReactNode } from "react";
import { SURFACES, USERS } from "../data/fixtures/static";
import { AppStateContext, type AppState } from "./context";

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(USERS[0].id);
  const [surfaceId, setSurfaceId] = useState<string>(SURFACES[0].id);
  const [searchOpen, setSearchOpen] = useState(false);

  const value = useMemo<AppState>(
    () => ({
      user: USERS.find((u) => u.id === userId) ?? USERS[0],
      setUserId,
      surface: SURFACES.find((s) => s.id === surfaceId) ?? SURFACES[0],
      setSurfaceId,
      searchOpen,
      setSearchOpen,
    }),
    [userId, surfaceId, searchOpen]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
