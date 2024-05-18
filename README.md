# LWC Store

A simple yet powerful reactive store for Lightning Web Components.

---

Inspired by the Signals technology behind SolidJs, Preact, Svelte 5 Runes and the Vue 3 Composition API, LWC Store is a
reactive store for Lightning Web Components that allows you to create reactive data stores
that can be used to share state between components.

# Getting Started

Copy the `force-app/lwc/store` folder to your project.

> ✏️ Note that the source code is written in Typescript and is located in the `src` folder. The `force-app/lwc/store` folder
> contains the compiled code. If you wish to modify the source code you can either modify the resulting JS code, or you can
> grab the Typescript files from the `src` folder and set up your project to compile them.

# Usage

## Introduction

The LWC framework relies on message passing (either through pub/sub, CustomEvents or the Lightning Message Service (
LMS))
to communicate between components.

This can be cumbersome when you have a lot of components that need to share state for many reasons:

- You have to dispatch and handle the state events through all the components in the hierarchy (when using CustomEvents)
- You have to manage the state in a parent component, which relies on having the component on the page (when using
  pub/sub and messages)
- You have to make sure manage subscriptions and unsubscriptions to events

An alternative is to use the `wire` service to get the data from the server and let the framework handle the caching
for you, but this only works for data that is stored in the server, and still forces you to implement a lot of
boilerplate code to manage each wire adapter for each component.

`LWC Store` provides a simple way to create reactive data stores that can be used to share state between components
without the need to broadcast messages or manage subscriptions and wires.

## Creating a store

> 👀 You can find the full working code for the following example in the `examples`
> folder.

A `store` is simply an object with a `.value` property which holds a value. Any store you create should be an LWC
Service that exports your store.

```javascript
// LWC Service: counter-store.js
import { $store } from "c/store";

const counter = $store(0);

export { counter };
```

## Consuming the store

You can use the store in any LWC component by importing the store and using the `.value` property.

For example, let's create a simple counter component that increments and decrements the counter when a button is
clicked.

```html
<!-- counter.html -->
<template>
  <div>
    <button onclick="{decrement}">Decrement</button>
    <button onclick="{increment}">Increment</button>
  </div>
</template>
```

To update the counter, you can simply change the `counter.value` property directly.

```javascript
// counter.js
import { LightningElement } from "lwc";
import { counter } from "c/counter-store";

export default class Counter extends LightningElement {
  increment() {
    counter.value++;
  }

  decrement() {
    counter.value--;
  }
}
```

## Reacting to changes

### `$reactTo`

To have your components automatically react to changes in the store, you can use the `$reactTo`
function to create a reactive value that will update whenever the store changes.

Let's create another component that displays the counter value and automatically updates when the counter changes.

```html
<!-- display.html -->
<template>
  <p>The current count is: {counter.value}</p>
</template>
```

```javascript
// display.js
import { LightningElement } from "lwc";
import { $reactTo } from "c/store";
import { counter } from "c/counter-store";

export default class Display extends LightningElement {
  get counter() {
    return $reactTo(counter);
  }
}
```

> ❗`$reactTo` should be used inside a getter to make sure that the UI updates when the value changes.
> Keep reading to see other ways to react to changes in the store.

<div style="text-align: center;">
    <img src="./doc-assets/counter-example.gif" alt="Counter Example" />
</div>

---

### `$computed`

You can also use the `$computed` function to create a reactive value that depends on the store.
The difference between `$reactTo` and `$computed` is that `$computed` allows you return a derived computed store (with
the difference of it being read only)
from the original, or multiple stores.

```javascript
// display.js
import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { counter } from "c/counter-store";

export default class Display extends LightningElement {
  get counterMultiplied() {
    return $computed(() => counter.value * 2).value;
  }
}
```

---

Notice that in the examples we have been using getters to react to value changes. This is because LWC's reactive system
can automatically detect changes in getters for simple values and updates the UI accordingly, which makes for a cleaner
developer experience
and easier to reason about the code.

But there are cases where we need to use a property in case of a getter, for example when computing values into a
complex object, in which case the LWC
framework won't update the UI automatically. For cases like this, you can leverage the
`$computed` function to create a reactive property that will update whenever the store changes.

> See the (Reacting to multiple stores)[#reacting-to-multiple-stores] section for an example where we need
> to use a property instead of a getter.

```javascript
// display.js
import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { counter } from "c/counter-store";

export default class Display extends LightningElement {
  counter = $computed(counter, () => (this.counter = counter.value)).value;
}
```

> ❗ Note that in the callback function we **need** to reassign the value to `this.counter`
> to trigger the reactivity. This is because we need the value to be reassigned so that
> LWC reactive system can detect the change and update the UI.

### Stacking computed values

You can also stack computed values to create more complex reactive values that derive from each other

```javascript
import { $store, $computed } from "c/store";

export const counter = $store(0);

export const counterPlusOne = $computed(() => counter.value + 1);
export const counterPlusTwo = $computed(() => counterPlusOne.value + 1);
```

Because `$computed` values return a store, you can use them as you would use any other store.

## Reacting to multiple stores

You can also use multiple stores in a single `computed` and react to changes in any of them.
This gives you the ability to create complex reactive values that depend on multiple data sources
without having to track each one independently.

> 👀 You can find the full working code for the following example in the `examples`
> folder.

**Given the following stores**

```javascript
// LWC Service: contact-info.js

import { $store } from "c/store";

export const accountName = $store("ACME");

export const contactName = $store("John Doe");
```

**And given a component that updates both stores**

```html
<!-- contactInfoForm.html -->
<template>
  <lightning-input
    label="Account Name"
    value="{accountName}"
    onchange="{handleAccountNameChange}"
  ></lightning-input>
  <lightning-input
    label="Contact Name"
    value="{contactName}"
    onchange="{handleContactNameChange}"
  ></lightning-input>
</template>
```

```javascript
// contactInfoForm.js
import { LightningElement } from "lwc";
import { $reactTo } from "c/store";
import { accountName, contactName } from "c/demoStores";

export default class ContactInfoForm extends LightningElement {
  get accountName() {
    return $reactTo(accountName);
  }

  get contactName() {
    return $reactTo(contactName);
  }

  handleAccountNameChange(event) {
    accountName.value = event.target.value;
  }

  handleContactNameChange(event) {
    contactName.value = event.target.value;
  }
}
```

**You can create a computed value that depends on both stores**

```html
<!-- businessCard.html -->
<template>
  <div class="slds-card">
    <div class="slds-card__body slds-card__body_inner">
      <div>Account Name: {contactInfo.accountName}</div>
      <div>Contact Name: {contactInfo.contactName}</div>
    </div>
  </div>
</template>
```

```javascript
// businessCard.js
import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { accountName, contactName } from "c/demoStores";

export default class BusinessCard extends LightningElement {
  contactInfo = $computed(
    () =>
      (this.contactInfo = {
        accountName: accountName.value,
        contactName: contactName.value
      })
  ).value;
}
```

<div style="text-align: center;">
    <img src="./doc-assets/business-card-example.gif" alt="Counter Example" />
</div>

> ❗ Notice that we are using a property instead of a getter in the `$computed` callback function, because
> we need to reassign the value to `this.contactInfo` to trigger the reactivity, as it is a complex object.

### `$effect`

You can also use the `$effect` function to create a side effect that depends on the store.

Let's say you want to keep a log of the changes in the `counter` store.

```javascript
import { $store, $effect } from "c/store";

export const counter = $store(0);

$effect(() => console.log(counter.value));
```

> ❗ DO NOT use `$effect` to update the store value, as it will create an infinite loop.

# Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for more information.
