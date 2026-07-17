import { useEffect, useRef } from "react";

/** Returns a ref; calls onOut when a pointer-down lands outside the referenced element.
 *  Capture-phase pointerdown so components that stop propagation (e.g. the
 *  React Flow canvas) can't swallow the event before it reaches us. */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(onOut: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [onOut]);
  return ref;
}
