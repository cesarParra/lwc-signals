const context = [];
function _getCurrentObserver() {
  return context[context.length - 1];
}
function $effect(fn) {
  const execute = () => {
    context.push(execute);
    try {
      fn();
    } finally {
      context.pop();
    }
  };
  execute();
}
function $computed(fn) {
  const computedStore = $store(fn());
  let newValue = computedStore.value;
  $effect(() => {
    newValue = fn();
  });
  return {
    get value() {
      return newValue;
    }
  };
}
// To be used for reactive LWC properties
// This function subscribes to the store and returns the store's current value.
function $rxProp(store, fn) {
  $effect(() => {
    fn();
  });
  return store.value;
}
function $rxProp2(store) {
  $effect(() => {
    console.log(store.value);
  });
  return store.value;
}
function $store(value) {
  let _value = value;
  const subscribers = new Set();
  return {
    get value() {
      const current = _getCurrentObserver();
      if (current) {
        subscribers.add(current);
      }
      return _value;
    },
    set value(newValue) {
      _value = newValue;
      for (const subscriber of subscribers) {
        subscriber();
      }
    }
  };
}
export { $store, $effect, $computed, $rxProp, $rxProp2 };
