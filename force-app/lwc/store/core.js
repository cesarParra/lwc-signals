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
  return computedStore.readOnly;
}
function $reactTo(store) {
  let _value = store.value;
  $effect(() => {
    _value = store.value;
  });
  return _value;
}
function $store(value) {
  let _value = value;
  const subscribers = new Set();
  function getter() {
    const current = _getCurrentObserver();
    if (current) {
      subscribers.add(current);
    }
    return _value;
  }
  function setter(newValue) {
    _value = newValue;
    for (const subscriber of subscribers) {
      subscriber();
    }
  }
  return {
    get value() {
      return getter();
    },
    set value(newValue) {
      setter(newValue);
    },
    readOnly: {
      get value() {
        return getter();
      }
    }
  };
}
export { $store, $effect, $computed, $reactTo };
