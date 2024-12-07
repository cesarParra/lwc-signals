import { useInMemoryStorage } from "./use";
import { debounce } from "./utils/debounce";
import { isEqual } from "./utils/isEqual";
import { ObservableMembrane } from "./observable-membrane/observable-membrane";
const context = [];
function _getCurrentObserver() {
  return context[context.length - 1];
}
const UNSET = Symbol("UNSET");
const COMPUTING = Symbol("COMPUTING");
const ERRORED = Symbol("ERRORED");
const READY = Symbol("READY");
const defaultEffectOptions = {
  _fromComputed: false,
  identifier: Symbol()
};
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
 * @param options Options to configure the effect
 */
function $effect(fn, options) {
  const _optionsWithDefaults = { ...defaultEffectOptions, ...options };
  const effectNode = {
    error: null,
    state: UNSET
  };
  const execute = () => {
    if (effectNode.state === COMPUTING) {
      throw new Error("Circular dependency detected");
    }
    context.push(execute);
    try {
      effectNode.state = COMPUTING;
      fn();
      effectNode.error = null;
      effectNode.state = READY;
    } catch (error) {
      effectNode.state = ERRORED;
      effectNode.error = error;
      _optionsWithDefaults.onError
        ? _optionsWithDefaults.onError(error, _optionsWithDefaults)
        : handleEffectError(error, _optionsWithDefaults);
    } finally {
      context.pop();
    }
  };
  execute();
  return {
    identifier: _optionsWithDefaults.identifier
  };
}
function handleEffectError(error, options) {
  const errorTemplate = `
  LWC Signals: An error occurred in a reactive function \n
  Type: ${options._fromComputed ? "Computed" : "Effect"} \n
  Identifier: ${options.identifier.toString()}
  `.trim();
  console.error(errorTemplate, error);
  throw error;
}
const defaultComputedOptions = {
  identifier: Symbol()
};
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
 * @param options Options to configure the computed value.
 */
function $computed(fn, options) {
  const _optionsWithDefaults = { ...defaultComputedOptions, ...options };
  const computedSignal = $signal(undefined, {
    track: true
  });
  $effect(
    () => {
      if (options?.onError) {
        // If this computed has a custom error handler, then the
        // handling occurs in the computed function itself.
        try {
          computedSignal.value = fn();
        } catch (error) {
          const previousValue = computedSignal.peek();
          computedSignal.value = options.onError(error, previousValue, {
            identifier: _optionsWithDefaults.identifier
          });
        }
      } else {
        // Otherwise, the error handling is done in the $effect
        computedSignal.value = fn();
      }
    },
    {
      _fromComputed: true,
      identifier: _optionsWithDefaults.identifier
    }
  );
  const returnValue = computedSignal.readOnly;
  returnValue.identifier = _optionsWithDefaults.identifier;
  return returnValue;
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
  forceUpdate() {
    return false;
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
  forceUpdate() {
    return true;
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
    if (
      !trackableState.forceUpdate() &&
      isEqual(newValue, _storageOption.get())
    ) {
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
    brand: Symbol.for("lwc-signals"),
    readOnly: {
      get value() {
        return getter();
      }
    },
    peek() {
      return _storageOption.get();
    }
  };
  delete returnValue.get;
  delete returnValue.set;
  delete returnValue.registerOnChange;
  delete returnValue.unsubscribe;
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
        if (!_isInitialLoad && isEqual(derivedSource, _previousParams)) {
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
function isASignal(anything) {
  return !!anything && anything.brand === Symbol.for("lwc-signals");
}
export { $signal, $effect, $computed, $resource, isASignal };
