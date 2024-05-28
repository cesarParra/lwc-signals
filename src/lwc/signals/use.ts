export type State<T> = {
  get: () => T;
  set: (newValue: T) => void;
}

export function createStorage<T>(
  get: () => T,
  set: (newValue: T) => void
): State<T> {
  return { get, set };
}

export function useInMemoryStorage<T>(value: T): State<T> {
  let _value: T = value;

  function getter() {
    return _value;
  }

  function setter(newValue: T) {
    _value = newValue;
  }

  return createStorage(getter, setter);
}

function useLocalStorageCreator<T>(key: string, value: T): State<T> {
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

export function useCookies<T>(key: string, expires?: Date) {
  return function (value: T) {
    function getter() {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(key));
      if (cookie) {
        return JSON.parse(cookie.split("=")[1]);
      }
      return value;
    }

    function setter(newValue: T) {
      document.cookie = `${key}=${JSON.stringify(newValue)}; expires=${expires?.toUTCString()}`;
    }

    return createStorage(getter, setter);
  };
}
