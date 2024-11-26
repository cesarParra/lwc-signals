export function debounce<F extends (...args: unknown[]) => unknown>(
  func: F,
  delay: number
): (...args: Parameters<F>) => void {
  let debounceTimer: number | null = null;
  return (...args: Parameters<F>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => func(...args), delay);
  };
}

export function deepEqual(x: unknown, y: unknown): boolean {
  const objectKeysFn = Object.keys,
    typeOfX = typeof x,
    typeOfY = typeof y;
  return x && y && typeOfX === "object" && typeOfX === typeOfY
    ? objectKeysFn(x).length === objectKeysFn(y).length &&
        objectKeysFn(x).every((key) => deepEqual((x as Record<string, unknown>)[key], (y as Record<string, unknown>)[key]))
    : x === y;
}
