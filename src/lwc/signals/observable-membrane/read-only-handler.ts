/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/*
 * Copyright (c) 2023, Salesforce.com, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { unwrap, isArray, isUndefined, ProxyPropertyKey } from "./shared";
import { BaseProxyHandler, ShadowTarget } from "./base-handler";

const getterMap = new WeakMap<() => any, () => any>();
const setterMap = new WeakMap<(v: any) => void, (v: any) => void>();

export class ReadOnlyHandler extends BaseProxyHandler {
  wrapValue(value: any): any {
    return this.membrane.getReadOnlyProxy(value);
  }

  wrapGetter(originalGet: () => any): () => any {
    const wrappedGetter = getterMap.get(originalGet);
    if (!isUndefined(wrappedGetter)) {
      return wrappedGetter;
    }
    const handler = this;
    const get = function (this: any): any {
      // invoking the original getter with the original target
      return handler.wrapValue(originalGet.call(unwrap(this)));
    };
    getterMap.set(originalGet, get);
    return get;
  }

  wrapSetter(originalSet: (v: any) => void): (v: any) => void {
    const wrappedSetter = setterMap.get(originalSet);
    if (!isUndefined(wrappedSetter)) {
      return wrappedSetter;
    }
    const handler = this;
    const set = function (this: any) {
      const { originalTarget } = handler;
      throw new Error(
        `Invalid mutation: Cannot invoke a setter on "${originalTarget}". "${originalTarget}" is read-only.`
      );
    };
    setterMap.set(originalSet, set);
    return set;
  }

  set(_shadowTarget: ShadowTarget, key: ProxyPropertyKey): boolean {
    const { originalTarget } = this;
    const msg = isArray(originalTarget)
      ? `Invalid mutation: Cannot mutate array at index ${key.toString()}. Array is read-only.`
      : `Invalid mutation: Cannot set "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`;
    throw new Error(msg);
  }
}
