export function calculateResumePageCount(
  visibleContentBottomPx: number,
  pageHeightPx: number
): number {
  if (!Number.isFinite(pageHeightPx) || pageHeightPx <= 0) return 1;
  if (!Number.isFinite(visibleContentBottomPx)) return 1;

  return Math.max(
    1,
    Math.ceil(Math.max(0, visibleContentBottomPx) / pageHeightPx - 1e-6)
  );
}
