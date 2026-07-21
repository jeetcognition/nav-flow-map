// Draggable side-panel width, persisted like the legacy app
// (min 260px, double-click resets to the default). The default splits the
// body so the graph gets ~3 parts to the panel's ~2 (graph:panel = 3:2),
// measured against the actual body width so it holds on any viewport.
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { readStorage, writeStorage } from "../lib/storage";

const PANEL_W_KEY = "navmap-panel-width";
const PANEL_MIN = 260;
// panel gets 2 of every 5 parts → graph:panel = 3:2
const PANEL_DEFAULT_FRACTION = 2 / 5;
const PANEL_FALLBACK = 460;

const clamp = (w: number) => Math.min(Math.max(w, PANEL_MIN), window.innerWidth - 200);

const defaultWidthFor = (bodyW: number) =>
  bodyW > 0 ? clamp(Math.round(bodyW * PANEL_DEFAULT_FRACTION)) : PANEL_FALLBACK;

export function usePanelWidth() {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const hasSaved = useRef(readStorage(PANEL_W_KEY) !== null);
  const [panelW, setPanelW] = useState(() => {
    const saved = parseInt(readStorage(PANEL_W_KEY) ?? "", 10);
    return Number.isFinite(saved) && saved > 0 ? clamp(saved) : PANEL_FALLBACK;
  });
  const dragState = useRef<{ startX: number; startW: number } | null>(null);

  // With no saved width, resolve the default against the real body width so the
  // 3:2 split is accurate before the first paint.
  useLayoutEffect(() => {
    if (hasSaved.current) return;
    const bodyW = bodyRef.current?.clientWidth ?? 0;
    setPanelW(defaultWidthFor(bodyW));
  }, []);

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
      hasSaved.current = true;
      return w;
    });
  }, []);
  const resetPanelW = useCallback(() => {
    const next = defaultWidthFor(bodyRef.current?.clientWidth ?? 0);
    setPanelW(next);
    writeStorage(PANEL_W_KEY, String(next));
    hasSaved.current = true;
  }, []);

  return { panelW, bodyRef, onResizerDown, onResizerMove, onResizerUp, resetPanelW };
}
