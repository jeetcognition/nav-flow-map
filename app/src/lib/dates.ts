/** Monday-anchored start of the ISO week containing the given date. */
export function weekStart(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = (out.getDay() + 6) % 7; // Mon=0
  out.setDate(out.getDate() - day);
  return out;
}

export interface WeekBucket {
  label: string;
  count: number;
}

/** Buckets items into the trailing `weeks` ISO weeks (oldest first). */
export function bucketByWeek(items: { createdAt: string }[], weeks = 5): WeekBucket[] {
  const newest = items.reduce((max, i) => Math.max(max, new Date(i.createdAt).getTime()), 0);
  const anchor = weekStart(newest ? new Date(newest) : new Date());
  const buckets: { start: number; label: string; count: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = new Date(anchor);
    start.setDate(start.getDate() - w * 7);
    buckets.push({
      start: start.getTime(),
      label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 0,
    });
  }
  for (const item of items) {
    const t = weekStart(new Date(item.createdAt)).getTime();
    const bucket = buckets.find((b) => b.start === t);
    if (bucket) bucket.count++;
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}
