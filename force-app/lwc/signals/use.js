export function createStorage(get, set) {
  return { get, set };
}
export function useInMemoryStorage(value) {
  let _value = value;
  function getter() {
    return _value;
  }
  function setter(newValue) {
    _value = newValue;
  }
  return createStorage(getter, setter);
}
