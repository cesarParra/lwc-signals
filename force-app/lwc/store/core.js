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
function $resource(fn, source, options) {
  function loadingState(data) {
    return {
      data: data,
      loading: true,
      error: null
    };
  }
  let _isInitialLoad = true;
  let _value = options?.initialValue ?? null;
  let _previousParams;
  const _store = $store(loadingState(_value));
  $effect(async () => {
    _store.value = loadingState(_value);
    const derivedSource = source instanceof Function ? source() : source;
    if (!_isInitialLoad && derivedSource === _previousParams) {
      // No need to fetch the data again if the params haven't changed
      return;
    }
    try {
      const data = await fn(derivedSource);
      // Keep track of the previous value
      _value = data;
      _store.value = {
        data,
        loading: false,
        error: null
      };
    } catch (error) {
      _store.value = {
        data: null,
        loading: false,
        error
      };
    } finally {
      _previousParams = derivedSource;
      _isInitialLoad = false;
    }
  });
  return _store.readOnly;
}
export { $store, $effect, $computed, $reactTo, $resource };
