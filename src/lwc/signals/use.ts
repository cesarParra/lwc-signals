export type ValueStorage<T> = {
  get: () => T;
  set: (newValue: T) => void;
}

export function createStorage<T>(
  get: () => T,
  set: (newValue: T) => void
): ValueStorage<T> {
  return { get, set };
}

export function useInMemoryStorage<T>(value: T): ValueStorage<T> {
  let _value: T = value;

  function getter() {
    return _value;
  }

  function setter(newValue: T) {
    _value = newValue;
  }

  return createStorage(getter, setter);
}

function useLocalStorageCreator<T>(key: string, value: T): ValueStorage<T> {
  function getter() {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
    return value;
  }

  function setter(newValue: T) {
    localStorage.setItem(key, JSON.stringify(newValue));
  }

  // Set initial value if not set
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  return createStorage(getter, setter);
}

export function useLocalStorage(key: string) {
  return function <T>(value: T) {
    return useLocalStorageCreator(key, value);
  };
}
