export function debounce<F extends (...args: unknown[]) => unknown>(func: F, delay: number): (...args: Parameters<F>) => void {
  let debounceTimer: NodeJS.Timeout | null = null;
  return (...args: Parameters<F>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => func(...args), delay);
  };
}
