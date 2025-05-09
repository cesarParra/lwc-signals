# LWC Signals

A simple yet powerful reactive state management solution for Lightning Web Components.

---

![GitHub Workflow Status](https://github.com/cesarParra/lwc-signals/actions/workflows/ci.yml/badge.svg)
![Version](https://img.shields.io/badge/version-1.5.2-blue)

Inspired by the Signals technology behind SolidJs, Preact, Svelte 5 Runes and the Vue 3 Composition API, LWC Signals is
a reactive signals implementation for Lightning Web Components.
It allows you to create reactive data signals that can be used to share up-to-date state between components.

It features:

- 🚀 **Reactivity** Based on SolidJs and Preact Signals it provides a fine-grained reactivity system that will
  automatically track dependencies and free them when not needed
- 🦥 **Lazy Evaluation** Signals are lazy and will only compute values when read.
- 🔬️ **Small Surface** The API does not offer more than what is needed, keeping the learning curve and bloat to a
  minimum

The goal is to allow you to create beautiful and complex user experiences, while achieving clean code that
separates concerns and is easy to maintain!

Easily implement:

- Reactive data stores
- Undo
- Optimistic updates
- Data caching through storage (localStorage, cookies, etc)

<p align="center">
    <img width="500" src="./doc-assets/full-example.gif" alt="Kitchen Sink Example" />
</p>

> To see the code for the example above, check the `examples/shopping-cart` folder.

# Getting Started

- Copy the `force-app/lwc/signals` folder to your project.

If you are have enabled [Typescript Support for your LWC Project](https://developer.salesforce.com/docs/platform/lwc/guide/ts.html#enable-typescript-support-for-your-lwc-project)
then copy the `src/lwc/signals` folder instead.

## Examples

To see a live example, clone this repository, create a scratch org and push the code to it.

The org comes with a pre-built Experience Site that contains the examples.

Go to:

- Setup
- All Sites
- Locate the `examples` site
- Click on `Builder`
- Publish the site

You can then access the examples by going to the URL of the site.

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

`LWC Signals` provides a simple way to create reactive data signals that can be used to share state between components
without the need to broadcast messages or manage subscriptions and wires.

## Creating a signal

> 👀 You can find the full working code for the following example in the `examples`
> folder.

A `signals` is simply an object with a `.value` property which holds a value. Any signal you create should be an LWC
Service that exports your signals.

```javascript
// LWC Service: counter-signals.js
import { $signal } from "c/signals";

const counter = $signal(0);

export { counter };
```

## Consuming the signal

You can use the signal in any LWC component by importing it and using the `.value` property.

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

To update the counter, you can change the `counter.value` property directly.

```javascript
// counter.js
import { LightningElement } from "lwc";
import { counter } from "c/counter-signals";

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

### Through `$bind`

You can use the `$bind` function to create a reactive value that depends on the signal.

```javascript
// display.js
import { LightningElement } from "lwc";
import { $bind } from "c/signals";
import { counter } from "c/counter-signals";

export default class Display extends LightningElement {
  counterProp = $bind(this, "counterProp").to(counter);
}
```

Note that the first argument to the `$bind` function is the `this` context of the component, and the second argument
is the name of the property that will be created on the component as a string. Then you call the `.to` function with
the signal you want to bind to.

<p align="center">
    <img src="./doc-assets/counter-example.gif" alt="Counter Example" />
</p>

### Through `$computed`

One downside of using `$bind` is that the second argument is a string, which can lead to typos and errors if the
property name is changed but the string is not updated.

So, alternatively, you can use the `$computed` function to create a reactive value that depends on the signal.

```javascript
// display.js
import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { counter } from "c/counter-signals";

export default class Display extends LightningElement {
  counter = $computed(() => (this.counter = counter.value)).value;
}
```

But notice that this syntax is a lot more verbose than using `$bind`.

> ❗ Note that in the callback function we **need** to reassign the value to `this.counter`
> to trigger the reactivity. This is because we need the value to be reassigned so that
> LWC reactive system can detect the change and update the UI.

### Through `$effect`

Finally, you can use the `$effect` function to create a side effect that depends on the signal.

```javascript
// display.js
import { LightningElement } from "lwc";
import { $effect } from "c/signals";
import { counter } from "c/counter-signals";

export default class Display extends LightningElement {
  counter = 0;

  constructor() {
    $effect(() => (this.counter = counter.value));
  }
}
```

#### Stacking computed values

You can also stack computed values to create more complex reactive values that derive from each other

```javascript
import { $signal, $computed } from "c/signals";

export const counter = $signal(0);

export const counterPlusOne = $computed(() => counter.value + 1);
export const counterPlusTwo = $computed(() => counterPlusOne.value + 1);
```

Because `$computed` values return a signal, you can use them as you would use any other signal.

### `$effect`

You can also use the `$effect` function to create a side effect that depends on a signal.

Let's say you want to keep a log of the changes in the `counter` signal.

```javascript
import { $signal, $effect } from "c/signals";

export const counter = $signal(0);

$effect(() => console.log(counter.value));
```

> ❗ DO NOT use `$effect` to update the signal value, as it will create an infinite loop.

## Peeking at the signal value

If the rare case that you have an effect that needs to read of a signal without subscribing to it, you can
use the signal's `peek` function to read the value.

```javascript
import { $signal, $effect } from "c/signals";

const counter = $signal(0);

$effect(() => console.log(counter.peek()));
```

This can be useful when you need to update the value of a signal based on its current value, but you want
to avoid causing a circular dependency.

```javascript
const counter = $signal(0);
$effect(() => {
  // Without peeking, this kind of operation would cause a circular dependency.
  counter.value = counter.peek() + 1;
});
```

Note that you should use this feature sparingly, as it can lead to bugs that are hard to track down.
The preferred way of reading a signal is through the `signal.value`.

## Error Handling

When unhandled errors occur in a `computed`, `effect` or `resource`,
by default, the error will be logged to the console through a `console.error` call, and then the error will be rethrown.

If you wish to know where the error is coming from, you can pass a second argument to the `computed`,
`effect` or `resource` with a unique identifier.

```javascript
$computed(
  () => {
    signal.value;
    throw new Error("error");
  },
  { identifier: "test-identifier" }
);

$effect(
  () => {
    signal.value;
    throw new Error("error");
  },
  { identifier: "test-identifier" }
);

$resource(
  asyncFunction,
  {},
  {
    identifier: "test-identifier"
  }
);
```

This value will be used only for debugging purposes, and does not affect the functionality otherwise.

In this example, the test-identifier string will appear as part of the console.error message.

### Custom Error Handlers

`computed`, `effect`, and `resource` signals can all receive a custom `onError` property,
that allows developers to completely override the default functionality that logs and rethrows the error.

#### Effect handlers

For `$effect` handlers, you can pass a function with the following shape:

```typescript
(error: any, options: { identifier: string | symbol }) => void
```

The function will receive the thrown error as the first argument, and an object with the identifier as the second.
It should not return anything.

Example:

```javascript
function customErrorHandlerFn(error) {
  // custom logic or logging or rethrowing here
}

$effect(
  () => {
    throw new Error("test");
  },
  {
    onError: customErrorHandlerFn
  }
);
```

#### Computed handlers

For `$computed` handlers, you can pass a function with the following shape:

```typescript
(error: unknown, previousValue: T, options: { identifier: string | symbol }) =>
  T | undefined;
```

Where you can return nothing, or a value of type `T`, which should be of the same type as the computed value itself.
This allows you to provide a "fallback" value, that the computed value will receive in case of errors.

As a second argument, you will receive the previous value of the computed signal, which can be useful to provide a
fallback value based on the previous value.

The third argument is an object with the received identifier.

Example

```javascript
function customErrorHandlerFn(error, _previousValue, _options) {
  // custom logic or logging or rethrowing here
  return "fallback value";
}

$computed(
  () => {
    throw new Error("test");
  },
  {
    onError: customErrorHandlerFn
  }
);
```

#### Resource handlers

For `resource` handlers, you can pass a function with the following shape:

```typescript
(error: unknown, previousValue: T | null, options: { initialValue: T | null, identifier: string | symbol }) =>
        AsyncData<T> | void

// Where AsyncData looks as follows
// {
//   data: T | null;
//   loading: boolean;
//   error: unknown | null;
// };
```

Where you can return nothing, or a value of type `AsyncData<T>`.
`AsyncData` is the shape that all resources take, and it contains the data, loading state, and error state.
This allows you to provide a "fallback" value, that the computed value will receive in case of errors.

As a second argument, you will receive the previous value of the resource (or null if there is none), which can be useful to provide a
fallback value based on the previous value.

The third argument is an object with the received identifier as well as any initial value that was provided to the
resource when it was created.

Example

```javascript
function customErrorHandlerFn(error, _previousValue, _options) {
  // custom logic or logging or rethrowing here
  return {
    data: "fallback value",
    loading: false,
    error: error
  };
}

$resource(
  asyncFunction,
  {},
  {
    onError: customErrorHandlerFn
  }
);
```

## Tracking objects and arrays

By default, for a signal to be reactive it needs to be reassigned. This can be cumbersome when dealing with objects
and arrays, as you would need to reassign the whole object or array to trigger the reactivity.

To improve that experience, you can set the `track` flag to true when creating the signal. This will make the signal
reactive to changes in the object or array properties.

> 📒 Think about this as using the `@track` decorator in LWC properties. It works the exact same way behind the scenes.

```javascript
import { $signal } from "c/signals";

const obj = $signal({ x: 1, y: 2 }, { track: true });
const computedFromObj = $computed(() => obj.value.x + obj.value.y);

// When a value in the object changes, the computed value will automatically update
obj.value.x = 2;

console.log(computedFromObj.value); // 4
```

## Reacting to multiple signals

You can also use multiple signals in a single `computed` or `effect` and react to changes in any of them.
This allows you to create complex reactive values that depend on multiple data sources
without having to track each one independently.

> 👀 You can find the full working code for the following example in the `examples`
> folder.

**Given the following signals**

```javascript
// LWC Service: contact-info.js

import { $signal } from "c/signals";

export const accountName = $signal("ACME");

export const contactName = $signal("John Doe");
```

**And given a component that updates both signals**

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
import { $computed } from "c/signals";
import { accountName, contactName } from "c/demoSignalss";

export default class ContactInfoForm extends LightningElement {
  accountName = $computed(() => (this.accountName = accountName.value)).value;

  contactName = $computed(() => (this.contactName = contactName.value)).value;

  handleAccountNameChange(event) {
    accountName.value = event.target.value;
  }

  handleContactNameChange(event) {
    contactName.value = event.target.value;
  }
}
```

**You can create a computed value that depends on both signals**

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
import { $computed } from "c/signals";
import { accountName, contactName } from "c/demoSignals";

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

<p align="center">
    <img src="./doc-assets/business-card-example.gif" alt="Counter Example" />
</p>

> ❗ Notice that we are using a property instead of a getter in the `$computed` callback function, because
> we need to reassign the value to `this.contactInfo` to trigger the reactivity, as it is a complex object.

## Communicating with Apex data and other asynchronous operations

You can also use the signals framework to communicate with Apex data and other asynchronous operations.

In a traditional LWC component, you would use the `@wire` service to fetch data from the server and update the UI,
or you could declaratively call Apex methods by importing them and calling them directly.

If you only wish to fetch data once and hold that data within a component, you should still use the `@wire` service
or imperative Apex calls within your own component.

Where the Signals framework comes in handy is when you wish for multiple components to share the same data to have a
single
source of truth, and/or when you want to have a reactive system that updates the UI automatically when the data changes,
no matter where the change comes from.

### $resource

The `$resource` function is a helper function that allows you to create a signal that fetches data asynchronously,
which includes Apex methods imported through `@salesforce/apex/`.

---

Let's first take a look at the simple example of fetching data from the server through a single source of truth
(the resource signal) and sharing it between components.

**Given the following Apex method**

```apex
// Apex Class: ContactController.cls
public with sharing class ContactController {
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts() {
        return [SELECT Id, Name FROM Contact];
    }
}
```

**And the following signal**

```javascript
// LWC Service: contact-signals.js
import { $resource } from "c/signals";
import getContacts from "@salesforce/apex/ContactController.getContacts";

// Notice that we have to destructure the data property from the resource signal
// We explain why below in the "refetching" section :)
export const { data: fetchContacts } = $resource(getContacts);
```

**You can use the signal in any component**

```html
<!-- contactList.html -->
<template>
  <template if:true="{contacts.loading}"> Loading</template>
  <template if:false="{contacts.loading}">
    <template for:each="{contacts.data}" for:item="contact">
      <div key="{contact.Id}">
        <p>{contact.Name}</p>
      </div>
    </template>
  </template>
</template>
```

```javascript
// contactList.js
import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { fetchContacts } from "c/contact-signals";

export default class ContactList extends LightningElement {
  contacts = $computed(() => (this.contacts = fetchContacts.value)).value;
}
```

Data from a resource signal comes in as a read-only signal in the following format:

```typescript
type AsyncData<T> = {
  data: T | null; // The data fetched from the server. It is null until the data is fetched
  loading: boolean; // A boolean that indicates if the data is being fetched
  error: unknown | null; // An error object that is populated if the fetch fails
};
```

> 🍪 One benefit of using the `$resource` over declarative Apex or `@wire` is that it keeps track of the loading
> state for you, which saves you the effort of having to calculate it yourself.

<p align="center">
    <img src="./doc-assets/apex-fetch.gif" alt="Fetching From Apex" />
</p>

---

Let's now take a look at the more complex example of fetching data from the server through a method that takes
parameters, and having it react once those parameters change.

Imagine we have 2 components, one that displays a list of accounts and another that displays the details of a single
selected account. We want the details component to update whenever the selected account changes. Let's see how we can
achieve this with.

**Given the following Apex controller**

```apex
public with sharing class ResourceController {
    @AuraEnabled(Cacheable=true)
    public static List<Account> getAccounts() {
        return [SELECT Id, Name FROM Account];
    }

    @AuraEnabled
    public static Account getAccountDetails(Id accountId) {
        if (accountId == null) {
            return null;
        }
        return [SELECT Id, Name, Phone, Website FROM Account WHERE Id = :accountId];
    }
}
```

We can have a signal that keeps track of which Account Id has been selected, and a `resource` signal that fetches the
details of the selected account.

```javascript
import { $signal, $resource, $effect } from "c/signals";
import getAccountDetails from "@salesforce/apex/ResourceController.getAccountDetails";

export const selectedAccountId = $signal(null);

export const { data: getAccount } = $resource(getAccountDetails, () => ({
  accountId: selectedAccountId.value
}));
```

Notice that the resource signal takes a second optional argument, which in this case is a function that returns an
object with the parameters that the Apex method needs. Because this function is accessing a reactive
value (`selectedAccountId`),
the resource signal will automatically refetch the data whenever the `selectedAccountId` changes!

> 🍪 The value doesn't need to be a function unless you need the reactivity, it can also be a regular JS object in the
> format expected by your Apex method (e.g. `{ accountId: "001200000XyZ1QAQ" }`).

This works no matter how many reactive values you use in the function, and it will automatically refetch the data
whenever any of the reactive values change.

Let's now create our picklist component that allows the user to select an account.

```html
<!-- accountPicker.html -->
<template>
  <lightning-select
    label="Select Account"
    value="{currentAccountId}"
    options="{accounts}"
    onchange="{handleAccountChange}"
  ></lightning-select>
</template>
```

```javascript
// accountPicker.js
import { LightningElement, track, wire } from "lwc";
import getAccounts from "@salesforce/apex/ResourceController.getAccounts";
import { selectedAccountId } from "c/demoSignals";

export default class AccountPicker extends LightningElement {
  @track accounts = [];

  @wire(getAccounts) getAccounts({ error, data }) {
    if (data) {
      this.accounts = data.map((account) => ({
        label: account.Name,
        value: account.Id
      }));

      if (this.accounts.length > 0) {
        selectedAccountId.value = this.accounts[0].value;
      }
    } else if (error) {
      console.error(error);
    }
  }

  get currentAccountId() {
    return selectedAccountId.value;
  }

  handleAccountChange(event) {
    selectedAccountId.value = event.detail.value;
  }
}
```

Notice how we are using a `@wire` service to fetch the accounts from the server and populate the picklist. This is
because in this case we don't care about sharing that data with other components, and we only need it once. Be
pragmatic about when to use signals and when not to. Opt to use the base Salesforce services when you only need the
data
in a single component.

Now, let's create the component that displays the details of the selected account.

```html
<!-- accountDetails.html -->
<template>
  <div>
    <h1>Selected Account</h1>
    <template if:true="{account.loading}">
      <lightning-spinner
        alternative-text="Loading"
        size="large"
      ></lightning-spinner>
    </template>

    <template if:false="{account.loading}">
      <template if:true="{account.data}">
        <p>Account Name: {account.data.Name}</p>
        <p>Phone: {account.data.Phone}</p>
        <p>Website: {account.data.Website}</p>
      </template>
    </template>
  </div>
</template>
```

```javascript
// accountDetails.js
import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { getAccount } from "c/demoSignals";

export default class AccountDetails extends LightningElement {
  account = $computed(() => (this.account = getAccount.value)).value;
}
```

<p align="center">
    <img src="./doc-assets/account-picker.gif" alt="Account Picker Example" /> 
</p>

> 🍪 One extra feature of the data returned by the `$resource` function is that when it is reloading the data, the
> previous data is still available in the `data` property. This allows you to keep the old value while the new value is
> being loaded and provide for a smoother experience, to avoid flickering or loading spinners that disappear
> immediately,
> when you know the data is going to be fetched quickly.

---

### Providing a default value to an async resource

You can provide a default value to an async resource by passing it as the third argument to the `$resource` function.

```javascript
import { $resource } from "c/signals";

const { data: resource } = $resource(asyncFunction, undefined, {
  initialValue: "initial"
});
```

### Refetching data

When you use the `$resource` function, the signal will automatically refetch the data whenever the reactive values
change. This is useful when you want to refetch the data when the parameters change, but it can also be a problem when
you want to keep the data in the signal and only refetch it when you explicitly tell it to.

To solve this problem, you can use the `refetch` function that is returned by the `$resource` function.

```javascript
import { $signal, $resource } from "c/signals";
import getContacts from "@salesforce/apex/ContactController.getContacts";

export const { data: fetchContacts, refetch: refetchContacts } =
  $resource(getContacts);
```

You can then call the `refetch` function whenever you want to refetch the data.

```javascript
// contactList.js
import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { fetchContacts, refetchContacts } from "c/contact-signals";

export default class ContactList extends LightningElement {
  contacts = $computed(() => (this.contacts = fetchContacts.value)).value;

  handleRefresh() {
    refetchContacts();
  }
}
```

### Mutating `$resource` data

Notice that the data returned by a resource is a ReadOnlySignal.
This means that you cannot mutate the data directly, so how can you update the data?

Besides `refetch`, the `$resource` function also returns a `mutate` function that allows you to mutate the data.

`mutate` is useful when you want to update the data without refetching it (and avoid a trip to the server).

It receives a single value, which will be set as the new value of the data. The `resource` value will be updated
immediately, the `.loading` property will be set to `false`, and the `.error` property will be set to `null`.

```javascript
import { $resource } from "c/signals";

const { data, mutate } = $resource(asyncFunction);

mutate("new value");
```

#### Reacting to mutated values

When using the `mutate` function, you might want to react to the changes in the data. For example, you might now
want to call an Apex function to save the new value to the server, and make sure the data is synced.

For this, you can provide a function through the options object's `onMutate`.

The function you provide can receive 3 arguments:

- The new value
- The old value
- A `mutate` function that you can use the update the data again. This can be used for when you want to update the data
  based on what was returned from the server, but you don't want to refetch the data. You SHOULD use this mutate
  function over the one returned when creating the `$resource` because this will not trigger `onMutate` once again.

```javascript
import { $resource } from "c/signals";
import getContacts from "@salesforce/apex/ContactController.getContacts";
import saveContacts from "@salesforce/apex/ContactController.saveContacts";

const { data, mutate } = $resource(
  getContacts,
  {},
  {
    onMutate: async (newValue, oldValue, mutate) => {
      await saveContacts({ contacts: newValue });
      mutate(newValue);
    }
  }
);
```

In the case an error occurs on your server call, the `mutate` you can pass an error object as the second argument to
the `mutate` function. This will set the `.error` property of the `resource` to the error object.

```javascript
import { $resource } from "c/signals";

const { data, mutate } = $resource(asyncFunction);

try {
  await saveContacts({ contacts: newValue });
  mutate(newValue);
} catch (error) {
  mutate(null, error);
}
```

#### Optimistic updating

When you mutate a `resource` as exemplified above, you can achieve the concept of optimistic updating. This is when you
update the value immediately before the server responds, and then update the value again when the server responds.

Optimistically updating the value can provide a better user experience by making the UI feel more responsive, but it
can also lead to inconsistencies if the server responds with an error. So if you wish to turn this off, and
manage updating the value yourself, either by `refetching` or by using an `onMutate` function, you can set the
`optimisticMutate` option to `false`.

```javascript
import { $resource } from "c/signals";

const { data, refetch, mutate } = $resource(
  asyncFunction,
  {},
  {
    optimisticMutate: false
  }
);
```

#### Defining when to fetch and refetch data

There are situations when you don't want to fetch the data immediately when the component is created, or when you
don't want to refetch the data when the reactive values change.

For example, you might have an initial null value for a reactive value, and you only want to fetch the data when the
value is set to a non-null value. In this situation you don't want to waste a call to the server since you know the
data is not going to be used or will come back as null.

An additional option you can pass to the `$resource` function is `fetchWhen`. This is any function that returns
a boolean. If the function returns `true`, the data will be fetched. If it returns `false`, the data will not be
fetched.

```javascript
import { $signal, $resource, $effect } from "c/signals";
import getAccountDetails from "@salesforce/apex/ResourceController.getAccountDetails";

export const selectedAccountId = $signal(null);

export const { data: getAccount } = $resource(
  getAccountDetails,
  () => ({
    accountId: selectedAccountId.value
  }),
  {
    fetchWhen: () => selectedAccountId.value !== null
  }
);
```

## Storage

By default, any created signal is stored in memory and will be lost when the component is destroyed. This behavior
can be modified by passing a `storage` option to the `$signal` function. For example, if you wish for
the signal to be stored in the `localStorage`, you can use `useLocalStorage` helper function.

```javascript
import { $signal, useLocalStorage } from "c/signals";

const counter = $signal(0, { storage: useLocalStorage("my-key-name") });
```

The following storage helpers are available by default:

- `useLocalStorage(key: string)`: Stores the signal in the `localStorage` with the given key
- `useSessionStorage(key: string)`: Stores the signal in the `sessionStorage` with the given key
- `useCookies(key: string, expires?: Date)`: Stores the signal in a cookie with the given key. You can also pass an
  optional `expires` parameter to set the expiration date of the cookie
- `useEventListener(eventName: string)`: Dispatches a CustomEvent to the `window` object with the given event name
  whenever the signal changes. It also listens for events with the given name and updates the signal when the event is
  received. This is useful for when you want to communicate changes to components that for some reason don't
  have access to the signal (for example, a component that cannot import the signal because it lives in a different
  namespace).

  The event sent and expected to be received has the following format:

  ```
   {
     detail: {
       data: T;
   };
  ```

  Where `T` is the type of the signal.

  ```javascript
  import { $signal, useEventListener } from "c/signals";

  const counter = $signal(0, { storage: useEventListener("counter-change") });
  ```

  and from another component

  ```javascript
  ...
  connectedCallback() {
    window.addEventListener("counter-change", (event) => {
    console.log(event.detail.data);
    });
  }
  ...
  handleSomeChange() {
    window.dispatchEvent(new CustomEvent("counter-change", { detail: { data: 1 } }));
  }
  ```

- `useEventBus(channel: string, toValue: (response?: object) => T, options: object)`: Subscribes to the event bus
  channel (e.g. platform event, change data capture, etc.).

  - The `channel` parameter is the event bus channel to subscribe to.
  - The `toValue` function is used to convert the response from the event bus to the desired value.

  ```javascript
  import { $signal, useEventBus } from "c/signals";
  export const receivedEvent = $signal(undefined, {
    storage: useEventBus("/event/PlatEvent__e", ({ data }) => ({
      message: data.payload.Message__c,
      sender: data.payload.Sender__c,
      time: data.payload.Time__c
    }))
  });
  ```

  The passed in argument will be the message received from the event bus, which
  is of the following shape:

  ```javascript
  {
      channel: string;
      data: {
        event: {
          replayId: number;
        },
        payload: object,
      };
    }
  ```

  The `payload` key will contain the actual data of the event. For example,
  if using a platform event, this will contain the fields of the platform event.

  - The `options` (optional) parameter is an object that can contain the following properties (all of them optional):
    - `replayId` The replay ID to start from, defaults to -1. When -2 is passed, it will replay from the last saved
      event.
    - `onSubscribe` A callback function called when the subscription is successful.
    - `onError` A callback function called when an error response is received from the server for
      handshake, connect, subscribe, and unsubscribe meta channels.

  **Unsubscribing from the event bus**

  When using the `useEventBus` storage, the signal will hold a special function called `unsubscribe` that you can call
  to unsubscribe from the event bus.

  ```javascript
  import { $signal, useEventBus } from "c/signals";

  const receivedEvent = $signal(undefined, {
    storage: useEventBus("/event/PlatEvent__e", ({ data }) => ({
      message: data.payload.Message__c,
      sender: data.payload.Sender__c,
      time: data.payload.Time__c
    }))
  });

  // Unsubscribe from the event bus
  receivedEvent.unsubscribe();
  ```

### Creating a custom storage

The `storage` option receives a function that defines the behavior for where the data should be stored.
This means you can create your own custom storage solution by passing a function with the following
signature:

```typescript
// Note that we are using a Typescript signature for clarity,
// but you can use the same signature in Javascript. The example below is in Javascript.
type StorageFn<T> = (value: T) => {
  get: () => T;
  set: (newValue: T) => void;
};
```

To make things easier, we provide a helper function that creates a storage solution for you: `createStorage`.

For example, let's say you want to create a storage solution that allows you to undo to the previous value of a signal
as many times as you want.

```javascript
import { $signal, createStorage } from "c/signals";

const useUndo = (value) => {
  const _valueStack = [];

  // add the initial value to the stack
  _valueStack.push(value);

  function undo() {
    _valueStack.pop();
  }

  const customStorage = createStorage(
    () => {
      // Get value at the top of the stack
      return _valueStack[_valueStack.length - 1];
    },
    (newValue) => {
      _valueStack.push(newValue);
    }
  );

  return {
    ...customStorage,
    undo
  };
};

const counter = $signal(0, { storage: useUndo });

counter.value = 1;
counter.value = 2;
counter.value = 3;
counter.undo(); // counter.value is now 2
counter.undo(); // counter.value is now 1
counter.undo(); // counter.value is now 0
```

`createStorage` receives two functions: a getter and a setter. The getter should return the value stored in the
storage, and the setter should set the value in the storage.

Notice that any additional properties you add to the object returned by `createStorage` will be available in the
returned object. That is how we can add the `undo` function to the `counter` signal and use it to undo the changes.

## Debouncing

You can debounce the changes to a signal by passing a `debounce` option to the `$signal` function. This
is specially helpful when you have a `$resource` that re-fetches based on a reactive value that changes frequently.

```javascript
import { $signal } from "c/signals";

const counter = $signal(0, { debounce: 500 });
```

When you debounce a signal, the value will only be updated after the specified time has passed since the last change.

## Examples

You can find full working examples in the `examples` folder.

For a full kitchen sink example that combines all the concepts, you can check the `shopping-cart` example.

It includes:

- Getting data from the server
- Optimistic updates by updating the local value on change
- Re-updating the value when the server responds
- Undo functionality by storing the state history in a custom signal
- Caching the data in the `localStorage` for a fast first load.

<p align="center">
    <img width="500" src="./doc-assets/kitchen-sink.gif" alt="Kitchen Sink Example" />
</p>

# Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for more information.
