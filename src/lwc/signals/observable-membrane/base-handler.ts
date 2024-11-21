/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/*
 * Copyright (c) 2023, Salesforce.com, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import {
    ProxyPropertyKey,
} from './shared';
import { ObservableMembrane } from './observable-membrane';

export type ShadowTarget = object;

export abstract class BaseProxyHandler {
    originalTarget: any;
    membrane: ObservableMembrane;

    constructor(membrane: ObservableMembrane, value: any) {
        this.originalTarget = value;
        this.membrane = membrane;
    }

    // Abstract utility methods

    abstract wrapValue(value: any): any;
    abstract wrapGetter(originalGet: () => any): () => any;
    abstract wrapSetter(originalSet: (v: any) => void): (v: any) => void;

    // Abstract Traps

    abstract set(shadowTarget: ShadowTarget, key: ProxyPropertyKey, value: any): boolean;

    // Shared Traps
    get(_shadowTarget: ShadowTarget, key: ProxyPropertyKey): any {
        const {
            originalTarget,
            membrane: { valueObserved },
        } = this;
        const value = originalTarget[key];
        valueObserved(originalTarget, key);
        return this.wrapValue(value);
    }
}
