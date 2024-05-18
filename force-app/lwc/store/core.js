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
function $resource(fn) {
  const store = $store({
    data: null,
    loading: true,
    error: null
  });
  $effect(async () => {
    try {
      store.value = {
        data: await fn(),
        loading: false,
        error: null
      };
    } catch (error) {
      store.value = {
        data: null,
        loading: false,
        error
      };
    }
  });
  return store.readOnly;
}
export { $store, $effect, $computed, $reactTo, $resource };
