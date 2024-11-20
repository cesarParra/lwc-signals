/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/*
 * Copyright (c) 2023, Salesforce.com, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const { isArray } = Array;
const {
  prototype: ObjectDotPrototype,
  getPrototypeOf,
  create: ObjectCreate,
  defineProperty: ObjectDefineProperty,
  isExtensible,
  getOwnPropertyDescriptor,
  getOwnPropertyNames,
  getOwnPropertySymbols,
  preventExtensions,
  hasOwnProperty
} = Object;
const { push: ArrayPush, concat: ArrayConcat } = Array.prototype;
export {
  ArrayPush,
  ArrayConcat,
  isArray,
  getPrototypeOf,
  ObjectCreate,
  ObjectDefineProperty,
  ObjectDotPrototype,
  isExtensible,
  getOwnPropertyDescriptor,
  getOwnPropertyNames,
  getOwnPropertySymbols,
  preventExtensions,
  hasOwnProperty
};
const OtS = {}.toString;
export function toString(obj) {
  if (obj && obj.toString) {
    return obj.toString();
  } else if (typeof obj === "object") {
    return OtS.call(obj);
  } else {
    return obj + "";
  }
}
export function isUndefined(obj) {
  return obj === undefined;
}
export function isFunction(obj) {
  return typeof obj === "function";
}
const proxyToValueMap = new WeakMap();
export function registerProxy(proxy, value) {
  proxyToValueMap.set(proxy, value);
}
export const unwrap = (replicaOrAny) =>
  proxyToValueMap.get(replicaOrAny) || replicaOrAny;
