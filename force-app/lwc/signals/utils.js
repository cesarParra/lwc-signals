export function debounce(func, delay) {
    let debounceTimer = null;
    return (...args) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => func(...args), delay);
    };
}
