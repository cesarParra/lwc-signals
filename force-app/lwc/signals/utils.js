export function debounce(func, delay) {
  let debounceTimer = null;
  return (...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => func(...args), delay);
  };
}
// TODO: Uts:
// TODO: undefined value comparison
// TODO: simple value comparison
// TODO: object comparison
// TODO: array comparison
export function deepEqual(x, y) {
  const objectKeysFn = Object.keys,
    typeOfX = typeof x,
    typeOfY = typeof y;
  return x && y && typeOfX === "object" && typeOfX === typeOfY
    ? objectKeysFn(x).length === objectKeysFn(y).length &&
        objectKeysFn(x).every((key) => deepEqual(x[key], y[key]))
    : x === y;
}
