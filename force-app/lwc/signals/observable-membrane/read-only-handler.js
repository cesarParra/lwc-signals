/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/*
 * Copyright (c) 2023, Salesforce.com, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { unwrap, isArray, isUndefined } from './shared';
import { BaseProxyHandler } from './base-handler';
const getterMap = new WeakMap();
const setterMap = new WeakMap();
export class ReadOnlyHandler extends BaseProxyHandler {
    wrapValue(value) {
        return this.membrane.getReadOnlyProxy(value);
    }
    wrapGetter(originalGet) {
        const wrappedGetter = getterMap.get(originalGet);
        if (!isUndefined(wrappedGetter)) {
            return wrappedGetter;
        }
        const handler = this;
        const get = function () {
            // invoking the original getter with the original target
            return handler.wrapValue(originalGet.call(unwrap(this)));
        };
        getterMap.set(originalGet, get);
        return get;
    }
    wrapSetter(originalSet) {
        const wrappedSetter = setterMap.get(originalSet);
        if (!isUndefined(wrappedSetter)) {
            return wrappedSetter;
        }
        const handler = this;
        const set = function (v) {
            const { originalTarget } = handler;
            throw new Error(`Invalid mutation: Cannot invoke a setter on "${originalTarget}". "${originalTarget}" is read-only.`);
        };
        setterMap.set(originalSet, set);
        return set;
    }
    set(shadowTarget, key, value) {
        const { originalTarget } = this;
        const msg = isArray(originalTarget)
            ? `Invalid mutation: Cannot mutate array at index ${key.toString()}. Array is read-only.`
            : `Invalid mutation: Cannot set "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`;
        throw new Error(msg);
    }
    deleteProperty(shadowTarget, key) {
        const { originalTarget } = this;
        throw new Error(`Invalid mutation: Cannot delete "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`);
    }
    setPrototypeOf(shadowTarget, prototype) {
        const { originalTarget } = this;
        throw new Error(`Invalid prototype mutation: Cannot set prototype on "${originalTarget}". "${originalTarget}" prototype is read-only.`);
    }
    preventExtensions(shadowTarget) {
        const { originalTarget } = this;
        throw new Error(`Invalid mutation: Cannot preventExtensions on ${originalTarget}". "${originalTarget} is read-only.`);
    }
    defineProperty(shadowTarget, key, descriptor) {
        const { originalTarget } = this;
        throw new Error(`Invalid mutation: Cannot defineProperty "${key.toString()}" on "${originalTarget}". "${originalTarget}" is read-only.`);
    }
}
