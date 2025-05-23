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
// The maximum stack depth value is derived from Salesforce's maximum stack depth limit in triggers.
// This value is chosen to prevent infinite loops while still allowing for a reasonable level of recursion.
const MAX_STACK_DEPTH = 16;
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
    state: UNSET,
    stackDepth: 0
  };
  const execute = () => {
    if (
      effectNode.state === COMPUTING &&
      effectNode.stackDepth >= MAX_STACK_DEPTH
    ) {
      throw new Error(
        `Circular dependency detected. Maximum stack depth of ${MAX_STACK_DEPTH} exceeded.`
      );
    }
    context.push(execute);
    try {
      effectNode.state = COMPUTING;
      effectNode.stackDepth++;
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
      if (effectNode.stackDepth > 0) {
        effectNode.stackDepth--;
      }
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
        // handling occurs here, in the computed function itself.
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
const SIGNAL_OBJECT_BRAND = Symbol.for("lwc-signals");
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
    brand: SIGNAL_OBJECT_BRAND,
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
function defaultResourceErrorHandler(error, _previousValue, options) {
  const errorTemplate = `
  LWC Signals: An error occurred in a reactive function \n
  Type: Resource \n
  Identifier: ${options.identifier.toString()}
  `.trim();
  console.error(errorTemplate, error);
}
function $resource(fn, source, options) {
  const {
    initialValue = null,
    optimisticMutate = true,
    fetchWhen = () => true,
    identifier = Symbol(),
    onError = defaultResourceErrorHandler
  } = options ?? {};
  function loadingState(data) {
    return {
      data: data,
      loading: true,
      error: null
    };
  }
  let _isInitialLoad = true;
  let _value = initialValue;
  let _previousParams;
  const _signal = $signal(loadingState(_value));
  const execute = async () => {
    const derivedSourceFn = source instanceof Function ? source : () => source;
    try {
      let data = null;
      if (fetchWhen()) {
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
      const errorValue = onError(error, _value, { identifier, initialValue });
      if (errorValue) {
        _signal.value = errorValue;
      } else {
        _signal.value = {
          data: null,
          loading: false,
          error
        };
      }
    } finally {
      _isInitialLoad = false;
    }
  };
  $effect(execute, {
    identifier
  });
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
      if (optimisticMutate) {
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
    },
    identifier
  };
}
function isSignal(anything) {
  return !!anything && anything.brand === SIGNAL_OBJECT_BRAND;
}
class Binder {
  constructor(component, propertyName) {
    this.component = component;
    this.propertyName = propertyName;
  }
  to(signal) {
    $effect(() => {
      // @ts-expect-error The property name will be found
      this.component[this.propertyName] = signal.value;
    });
    return signal.value;
  }
}
function bind(component, propertyName) {
  return new Binder(component, propertyName);
}
export {
  $signal,
  $effect,
  $computed,
  $resource,
  bind,
  bind as $bind,
  isSignal
};
