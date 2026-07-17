/** Shimmer placeholder lines for loading states. */
export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-lines" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton" style={{ width: `${88 - i * 14}%` }} />
      ))}
    </div>
  );
}
