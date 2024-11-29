export function debounce(func, delay) {
  let debounceTimer = null;
  return (...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => func(...args), delay);
  };
}
