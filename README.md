# LWC Store

A simple yet powerful reactive store for Lightning Web Components.

---

Inspired by the Signals technology used by SolidJs, Preact, Svelte 5 Runes and the Vue 3 Composition API, LWC Store is a
reactive store for Lightning Web Components that allows you to create reactive data stores
that can be used to share state between components.

# Getting Started

Copy the `force-app/lwc/store` folder to your project.

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

A `store` is simply an object with a `.value` property that holds any value. Any store you create should be an LWC
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

You can also use the store in other components to react to changes in the store. For this you need
to use the `$computed` function to create a reactive value that depends on the store.

Let's create another component that displays the counter value.

```html
<!-- display.html -->
<template>
  <p>The current count is: {counter.value}</p>
</template>
```

```javascript
// display.js
import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { counter } from "c/counter-store";

export default class Display extends LightningElement {
  counter = $computed(() => (this.counter = counter.value));
}
```

> ❗ Note that in the $computed callback we need to reassign the value to `this.counter`
> to trigger the reactivity. This is because we need the value to be reassigned so that
> LWC reactive system can detect the change and update the UI.

<div style="text-align: center;">
    <img src="./doc-assets/counter-example.gif" alt="Counter Example" />
</div>

## Reacting to multiple stores

You can also use multiple stores in a single `computed` and react to changes in all of them.
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
import { $computed } from "c/store";
import { accountName, contactName } from "c/demoStores";

export default class ContactInfoForm extends LightningElement {
  accountName = $computed(() => (this.accountName = accountName.value));
  contactName = $computed(() => (this.contactName = contactName.value));

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
  );
}
```

<div style="text-align: center;">
    <img src="./doc-assets/business-card-example.gif" alt="Counter Example" />
</div>

# Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for more information.
