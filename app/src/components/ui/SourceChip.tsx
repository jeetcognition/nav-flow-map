import { Broadcast, Pulse } from "@phosphor-icons/react";
import type { Incident } from "../../types";
import "../../styles/incidents.css";

/** Pylon / Datadog source pill; optionally shows a count. */
export function SourceChip({ source, count }: { source: Incident["source"]; count?: number }) {
  const isPylon = source === "pylon";
  return (
    <span className={`src-chip ${isPylon ? "src-pylon" : "src-datadog"}`}>
      {isPylon ? <Broadcast size={12} weight="duotone" /> : <Pulse size={12} weight="duotone" />}
      {isPylon ? "Pylon" : "Datadog"}
      {count !== undefined && <span className="num">{count}</span>}
    </span>
  );
}
