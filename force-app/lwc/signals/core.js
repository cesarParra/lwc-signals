import { useInMemoryStorage } from "./use";
import { debounce, deepEqual } from "./utils";
import { ObservableMembrane } from "./observable-membrane/observable-membrane";
const context = [];
function _getCurrentObserver() {
  return context[context.length - 1];
}
/**
 * Creates a new effect that will be executed immediately and whenever
 * any of the signals it reads from change.
 *
 * Avoid changing $signal values inside an effect, as it can lead to
 * infinite loops.
 *
 * ```javascript
 * import { $signal, $effect } from 'c/signals';
 *
 * const count = $signal(0);
 *
 * $effect(() => {
 *  console.log(count.value);
 * });
 * ```
 *
 * @param fn The function to execute
 */
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
/**
 * Creates a new computed value that will be updated whenever the signals
 * it reads from change. Returns a read-only signal that contains the
 * computed value.
 *
 * ```javascript
 * import { $signal, $computed } from 'c/signals';
 *
 * const count = $signal(0);
 *
 * const double = $computed(() => count.value * 2);
 * ```
 *
 * @param fn The function that returns the computed value.
 */
function $computed(fn) {
  // The initial value is undefined, as it will be computed
  // when the effect runs for the first time
  const computedSignal = $signal(undefined);
  $effect(() => {
    computedSignal.value = fn();
  });
  return computedSignal.readOnly;
}
class UntrackedState {
  constructor(value) {
    this._value = value;
  }
  get() {
    return this._value;
  }
  set(value) {
    this._value = value;
  }
}
class TrackedState {
  constructor(value, onChangeCallback) {
    this._membrane = new ObservableMembrane({
      valueMutated() {
        onChangeCallback();
      }
    });
    this._value = this._membrane.getProxy(value);
  }
  get() {
    return this._value;
  }
  set(value) {
    this._value = this._membrane.getProxy(value);
  }
}
/**
 * Creates a new signal with the provided value. A signal is a reactive
 * primitive that can be used to store and update values. Signals can be
 * read and written to, and can be used to create computed values or
 * can be read from within an effect.
 *
 * You can read the current value of a signal by accessing the `value` property.
 *
 * ```javascript
 * import { $signal } from 'c/signals';
 *
 * const count = $signal(0);
 *
 * // Read the current value, logs 0
 * console.log(count.value);
 *
 * // Update the value
 * count.value = 1;
 * ```
 *
 * @param value The initial value of the signal
 * @param options Options to configure the signal
 */
function $signal(value, options) {
  // Defaults to not tracking changes through the Observable Membrane.
  // The Observable Membrane proxies the passed in object to track changes
  // to objects and arrays, but this introduces a performance overhead.
  const shouldTrack = options?.track ?? false;
  const trackableState = shouldTrack
    ? new TrackedState(value, notifySubscribers)
    : new UntrackedState(value);
  const _storageOption =
    options?.storage?.(trackableState.get()) ??
    useInMemoryStorage(trackableState.get());
  const subscribers = new Set();
  function getter() {
    const current = _getCurrentObserver();
    if (current) {
      subscribers.add(current);
    }
    return _storageOption.get();
  }
  function setter(newValue) {
    // TODO: New unit test for resources since this fixes a bug where it was always reevaluating
    // TODO: because it was checking for object equality, which in the case of a resource was always false.
    // TODO: The unit test should fail before, and pass with these changes
    if (deepEqual(newValue, _storageOption.get())) {
      return;
    }
    trackableState.set(newValue);
    _storageOption.set(trackableState.get());
    notifySubscribers();
  }
  function notifySubscribers() {
    for (const subscriber of subscribers) {
      subscriber();
    }
  }
  _storageOption.registerOnChange?.(notifySubscribers);
  const debouncedSetter = debounce(
    (newValue) => setter(newValue),
    options?.debounce ?? 0
  );
  const returnValue = {
    ..._storageOption,
    get value() {
      return getter();
    },
    set value(newValue) {
      if (options?.debounce) {
        debouncedSetter(newValue);
      } else {
        setter(newValue);
      }
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
  // Optimistic updates are enabled by default
  const _optimisticMutate = options?.optimisticMutate ?? true;
  const _fetchWhen = options?.fetchWhen ?? (() => true);
  const execute = async () => {
    const derivedSourceFn = source instanceof Function ? source : () => source;
    try {
      let data = null;
      if (_fetchWhen()) {
        const derivedSource = derivedSourceFn();
        // TODO: Use deepEquality to compare the derivedSource to previousParams
        if (!_isInitialLoad && derivedSource === _previousParams) {
          // No need to fetch the data again if the params haven't changed
          return;
        }
        _previousParams = derivedSource;
        _signal.value = loadingState(_value);
        data = await fn(derivedSource);
      } else {
        data = _value;
      }
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
      _isInitialLoad = false;
    }
  };
  $effect(execute);
  /**
   * Callback function that updates the value of the resource.
   * @param value The value we want to set the resource to.
   * @param error An optional error object.
   */
  function mutatorCallback(value, error) {
    _value = value;
    _signal.value = {
      data: value,
      loading: false,
      error: error ?? null
    };
  }
  return {
    data: _signal.readOnly,
    mutate: (newValue) => {
      const previousValue = _value;
      if (_optimisticMutate) {
        // If optimistic updates are enabled, update the value immediately
        mutatorCallback(newValue);
      }
      if (options?.onMutate) {
        options.onMutate(newValue, previousValue, mutatorCallback);
      }
    },
    refetch: async () => {
      _isInitialLoad = true;
      await execute();
    }
  };
}
export { $signal, $effect, $computed, $resource };
