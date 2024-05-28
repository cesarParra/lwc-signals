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
