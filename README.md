# LWC Store

A simple yet powerful reactive store for Lightning Web Components.

---

Inspired by Svelte runes, SolidJs and Preact signals, and the Vue 3 Composition API, LWC Store is a
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

- You have to pass the state through all the components in the hierarchy
- You have to manage the state in a parent component, which relies on having the component on the page
- You have to make sure manage subscriptions and unsubscriptions to events

An alternative is to use the `wire` service to get the data from the server and let the framework handle the caching
for you, but this only works for data that is stored in the server, and still forces you to implement a lot of
boilerplate
code to manage each wire adapter for each component.

`LWC Store` provides a simple way to create reactive data stores that can be used to share state between components
without
the need to broadcast messages or manage subscriptions and wires.

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

<div style="text-align: center;">
    <img src="./doc-assets/counter-example.gif" alt="Counter Example" />
</div>

> ❗ Note that in the $computed callback we need to reassign the value to `this.counter`
> to trigger the reactivity. This is because we need the value to be reassigned so that
> LWC reactive system can detect the change and update the UI.

# Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for more information.
