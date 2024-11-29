function isPlainObject(value) {
  return value?.constructor === Object;
}
export function isEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) return isSameArray(a, b);
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp)
    return a.toString() === b.toString();
  if (isPlainObject(a) && isPlainObject(b)) return isSameObject(a, b);
  if (a instanceof ArrayBuffer && b instanceof ArrayBuffer)
    return dataViewsAreEqual(new DataView(a), new DataView(b));
  if (a instanceof DataView && b instanceof DataView)
    return dataViewsAreEqual(a, b);
  if (isTypedArray(a) && isTypedArray(b)) {
    if (a.byteLength !== b.byteLength) return false;
    return isSameArray(a, b);
  }
  return false;
}
function isSameObject(a, b) {
  // check if the objects have the same keys
  const keys1 = Object.keys(a);
  const keys2 = Object.keys(b);
  if (!isEqual(keys1, keys2)) return false;
  // check if the values of each key in the objects are equal
  for (const key of keys1) {
    if (!isEqual(a[key], b[key])) return false;
  }
  // the objects are deeply equal
  return true;
}
function isSameArray(a, b) {
  if (a.length !== b.length) return false;
  return a.every((element, index) => isEqual(element, b[index]));
}
function dataViewsAreEqual(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  for (let offset = 0; offset < a.byteLength; offset++) {
    if (a.getUint8(offset) !== b.getUint8(offset)) return false;
  }
  return true;
}
function isTypedArray(value) {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}
