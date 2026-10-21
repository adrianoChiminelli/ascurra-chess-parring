/** 1 → "1", 1.5 → "1.5". */
export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1).replace(/\.0$/, '');
}
