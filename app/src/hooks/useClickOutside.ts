import { useEffect, useRef } from "react";

/** Returns a ref; calls onOut when a pointer-down lands outside the referenced element. */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(onOut: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOut]);
  return ref;
}
