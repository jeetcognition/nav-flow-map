// Draggable side-panel width, persisted like the legacy app
// (min 260px, double-click resets to the default).
import { useCallback, useRef, useState } from "react";
import { readStorage, writeStorage } from "../lib/storage";

const PANEL_W_KEY = "navmap-panel-width";
const PANEL_MIN = 260;

const clamp = (w: number) => Math.min(Math.max(w, PANEL_MIN), window.innerWidth - 200);

// Default split keeps graph:panel at roughly 3:1.
const getDefaultPanelW = () => clamp(Math.round(window.innerWidth / 4));

export function usePanelWidth() {
  const [panelW, setPanelW] = useState(() => {
    const saved = parseInt(readStorage(PANEL_W_KEY) ?? "", 10);
    return Number.isFinite(saved) && saved > 0 ? clamp(saved) : getDefaultPanelW();
  });
  const dragState = useRef<{ startX: number; startW: number } | null>(null);

  const onResizerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = { startX: e.clientX, startW: panelW };
    },
    [panelW],
  );
  const onResizerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    setPanelW(clamp(dragState.current.startW + (dragState.current.startX - e.clientX)));
  }, []);
  const onResizerUp = useCallback(() => {
    if (!dragState.current) return;
    dragState.current = null;
    setPanelW((w) => {
      writeStorage(PANEL_W_KEY, String(w));
      return w;
    });
  }, []);
  const resetPanelW = useCallback(() => {
    const defaultW = getDefaultPanelW();
    setPanelW(defaultW);
    writeStorage(PANEL_W_KEY, String(defaultW));
  }, []);

  return { panelW, onResizerDown, onResizerMove, onResizerUp, resetPanelW };
}
