import { useInMemoryStorage } from "./use";
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
  const computedSignal = $signal(fn());
  $effect(() => {
    computedSignal.value = fn();
  });
  return computedSignal.readOnly;
}
function $signal(
  value,
  options = {
    storage: useInMemoryStorage
  }
) {
  const _storageOption = options.storage(value);
  const subscribers = new Set();
  function getter() {
    const current = _getCurrentObserver();
    if (current) {
      subscribers.add(current);
    }
    return _storageOption.get();
  }
  function setter(newValue) {
    if (newValue === _storageOption) {
      return;
    }
    _storageOption.set(newValue);
    for (const subscriber of subscribers) {
      subscriber();
    }
  }
  const returnValue = {
    ..._storageOption,
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
  // We don't want to expose the `get` and `set` methods, so
  // remove before returning
  delete returnValue.get;
  delete returnValue.set;
  return returnValue;
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
  const _signal = $signal(loadingState(_value));
  const execute = async () => {
    _signal.value = loadingState(_value);
    const derivedSource = source instanceof Function ? source() : source;
    if (!_isInitialLoad && derivedSource === _previousParams) {
      // No need to fetch the data again if the params haven't changed
      return;
    }
    try {
      const data = await fn(derivedSource);
      // Keep track of the previous value
      _value = data;
      _signal.value = {
        data,
        loading: false,
        error: null
      };
    } catch (error) {
      _signal.value = {
        data: null,
        loading: false,
        error
      };
    } finally {
      _previousParams = derivedSource;
      _isInitialLoad = false;
    }
  };
  $effect(execute);
  return {
    data: _signal.readOnly,
    refetch: async () => {
      _isInitialLoad = true;
      await execute();
    }
  };
}
export { $signal, $effect, $computed, $resource };
