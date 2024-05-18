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
  $effect(() => {
    computedStore.value = fn();
  });
  return computedStore;
}
function $reactTo(store) {
  $effect(() => {
    // Simply access the store to subscribe to it
    store.value;
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
export { $store, $effect, $computed, $reactTo };
