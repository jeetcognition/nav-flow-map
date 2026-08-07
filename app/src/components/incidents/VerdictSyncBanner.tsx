// Sync status for human verdicts (QA-DEC-028): invisible when everything is
// saved; shows progress while a batch is in flight and a retry affordance
// when the worker rejected or the network dropped the batch.
import { useSyncExternalStore } from "react";
import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import {
  getVerdictSyncState,
  retryVerdictSync,
  subscribeVerdictSync,
} from "../../data/verdictsService";

export function VerdictSyncBanner() {
  const state = useSyncExternalStore(subscribeVerdictSync, getVerdictSyncState);
  if (state.error) {
    return (
      <div className="verdict-sync error" role="alert">
        <WarningCircle size={14} weight="duotone" />
        <span>
          {state.pending} verdict{state.pending === 1 ? "" : "s"} not saved — {state.error}
        </span>
        <button className="btn btn-mini" onClick={retryVerdictSync}>
          <ArrowClockwise size={13} weight="bold" /> Retry
        </button>
      </div>
    );
  }
  if (state.pending === 0) return null;
  return (
    <div className="verdict-sync" role="status">
      <span className="verdict-sync-dot" aria-hidden />
      Saving {state.pending} verdict{state.pending === 1 ? "" : "s"}…
    </div>
  );
}
