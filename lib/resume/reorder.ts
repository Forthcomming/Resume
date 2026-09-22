/** Immutable splice-based reorder. Returns same reference if no-op / out of bounds. */
export function reorderList<T>(
  list: readonly T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list as T[];
  }
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
