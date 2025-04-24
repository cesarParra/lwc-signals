import { useInMemoryStorage, State } from "./use";
import { debounce } from "./utils/debounce";
import { isEqual } from "./utils/isEqual";
import { ObservableMembrane } from "./observable-membrane/observable-membrane";

type ReadOnlySignal<T> = {
  readonly value: T;
};

export type Signal<T> = {
  get value(): T;
  set value(newValue: T);
  readOnly: ReadOnlySignal<T>;
  brand: symbol;
  peek(): T;
};

type Effect = {
  identifier: string | symbol;
};

const context: VoidFunction[] = [];

function _getCurrentObserver(): VoidFunction | undefined {
  return context[context.length - 1];
}

const UNSET = Symbol("UNSET");
const COMPUTING = Symbol("COMPUTING");
const ERRORED = Symbol("ERRORED");
const READY = Symbol("READY");

// The maximum stack depth value is derived from Salesforce's maximum stack depth limit in triggers.
// This value is chosen to prevent infinite loops while still allowing for a reasonable level of recursion.
const MAX_STACK_DEPTH = 16;

interface EffectNode {
  error: unknown;
  state: symbol;
  stackDepth: number;
}

type EffectOptions = {
  _fromComputed: boolean;
  identifier: string | symbol;
  onError?: (error: unknown, options: EffectOptions) => void;
};

const defaultEffectOptions: EffectOptions = {
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
function $effect(fn: VoidFunction, options?: Partial<EffectOptions>): Effect {
  const _optionsWithDefaults = { ...defaultEffectOptions, ...options };
  const effectNode: EffectNode = {
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

function handleEffectError(error: unknown, options: EffectOptions) {
  const errorTemplate = `
  LWC Signals: An error occurred in a reactive function \n
  Type: ${options._fromComputed ? "Computed" : "Effect"} \n
  Identifier: ${options.identifier.toString()}
  `.trim();

  console.error(errorTemplate, error);
  throw error;
}

type ComputedFunction<T> = () => T;
type ComputedOptions<T> = {
  identifier: string | symbol;
  onError?: (
    error: unknown,
    previousValue: T | undefined,
    options: { identifier: string | symbol }
  ) => T | undefined;
};

const defaultComputedOptions: ComputedOptions<unknown> = {
  identifier: Symbol()
};

type Computed<T> = ReadOnlySignal<T> & {
  identifier: string | symbol;
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
function $computed<T>(
  fn: ComputedFunction<T>,
  options?: Partial<ComputedOptions<T>>
): Computed<T> {
  const _optionsWithDefaults = { ...defaultComputedOptions, ...options };
  const computedSignal: Signal<T | undefined> = $signal(undefined, {
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

  const returnValue = computedSignal.readOnly as Computed<T>;
  returnValue.identifier = _optionsWithDefaults.identifier;
  return returnValue;
}

type StorageFn<T> = (value: T) => State<T> & { [key: string]: unknown };

type SignalOptions<T> = {
  storage: StorageFn<T>;
  debounce?: number;
  track?: boolean;
};

interface TrackableState<T> {
  get(): T;

  set(value: T): void;

  forceUpdate(): boolean;
}

class UntrackedState<T> implements TrackableState<T> {
  private _value: T;

  constructor(value: T) {
    this._value = value;
  }

  get() {
    return this._value;
  }

  set(value: T) {
    this._value = value;
  }

  forceUpdate() {
    return false;
  }
}

class TrackedState<T> implements TrackableState<T> {
  private _value: T;
  private _membrane: ObservableMembrane;

  constructor(value: T, onChangeCallback: VoidFunction) {
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

  set(value: T) {
    this._value = this._membrane.getProxy(value);
  }

  forceUpdate(): boolean {
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
function $signal<T>(
  value: T,
  options?: Partial<SignalOptions<T>>
): Signal<T> & Omit<ReturnType<StorageFn<T>>, "get" | "set"> {
  // Defaults to not tracking changes through the Observable Membrane.
  // The Observable Membrane proxies the passed in object to track changes
  // to objects and arrays, but this introduces a performance overhead.
  const shouldTrack = options?.track ?? false;
  const trackableState: TrackableState<T> = shouldTrack
    ? new TrackedState(value, notifySubscribers)
    : new UntrackedState(value);

  const _storageOption: State<T> =
    options?.storage?.(trackableState.get()) ??
    useInMemoryStorage(trackableState.get());
  const subscribers: Set<VoidFunction> = new Set();

  function getter() {
    const current = _getCurrentObserver();
    if (current) {
      subscribers.add(current);
    }
    return _storageOption.get();
  }

  function setter(newValue: T) {
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
    (newValue) => setter(newValue as T),
    options?.debounce ?? 0
  );
  const returnValue: Signal<T> & Omit<ReturnType<StorageFn<T>>, "get" | "set"> =
    {
      ..._storageOption,
      get value() {
        return getter();
      },
      set value(newValue: T) {
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

// $resource

type AsyncData<T> = {
  data: T | null;
  loading: boolean;
  error: unknown | null;
};

type ResourceResponse<T> = {
  data: ReadOnlySignal<AsyncData<T>>;
  mutate: (newValue: T) => void;
  refetch: () => void;
  identifier: string | symbol;
};

type MutatorCallback<T> = (value: T | null, error?: unknown) => void;

type OnMutate<T> = (
  newValue: T,
  oldValue: T | null,
  mutate: MutatorCallback<T>
) => Promise<void> | void;

type FetchWhenPredicate = () => boolean;

type ResourceOptions<T> = {
  initialValue: T;
  optimisticMutate: boolean;
  onMutate: OnMutate<T>;
  storage: StorageFn<T>;
  fetchWhen: FetchWhenPredicate;
  identifier: string | symbol;
  onError: OnResourceError<T>;
};

type OnResourceError<T> = (
  error: unknown,
  previousValue: T | null,
  options: {
    initialValue: T | null;
    identifier: string | symbol;
  }
) => AsyncData<T> | void;

function defaultResourceErrorHandler<T>(
  error: unknown,
  _previousValue: T | null,
  options: {
    initialValue: T | null;
    identifier: string | symbol;
  }
) {
  const errorTemplate = `
  LWC Signals: An error occurred in a reactive function \n
  Type: Resource \n
  Identifier: ${options.identifier.toString()}
  `.trim();

  console.error(errorTemplate, error);
}

/**
 * Creates a new resource that fetches data from an async source. The resource
 * will automatically fetch the data when the component is mounted.
 *
 * It receives a function that returns a promise, which will be called to fetch
 * the data. Optionally, you can provide a source object or function that will
 * be used as the parameters for the fetch function.
 *
 * If a function that contains $computed values is provided as the source, the
 * resource will automatically refetch the data when the computed value changes.
 *
 * `$resource` returns an object with 2 properties:
 * - `data`: a read-only signal that contains the current state of the resource. It has
 *  the following shape:
 *  ```javascript
 *  {
 *  data: ReadOnlySignal<T> | null;
 *  loading: boolean;
 *  error: unknown | null;
 *  }
 *  ```
 *
 * - `refetch`: a function that can be called to force refetch the data.
 *
 * ```javascript
 * import { $signal, $resource } from 'c/signals';
 * import getAccounts from '@salesforce/apex/AccountController.getAccounts';
 *
 * const accountId = $signal('00B5e00000Dv9ZCEAZ');
 *
 * // If the account Id value is changed, the resource will automatically refetch the data
 * const { data: accounts, refetch } = $resource(getAccounts, () => ({ recordId: accountId.value }));
 *
 * export { accounts, refetch };
 *
 * // Usage from a component
 * import { LightningElement } from 'lwc';
 * import { $computed } from 'c/signals';
 * import { accounts, refetch } from 'c/myResource';
 *
 * export default class MyComponent extends LightningElement {
 *   accounts = $computed(() => this.accounts = accounts.value).value;
 * }
 *
 * @param fn The function that will be called to fetch the data. Usually an Apex method but can be any async function.
 * @param source The source object or function that will be used as the parameters for the fetch function
 * @param options The options to configure the resource. Allows you to provide an initial value for the resource.
 */
function $resource<ReturnType>(
  fn: () => Promise<ReturnType>,
  source?: undefined,
  options?: Partial<ResourceOptions<ReturnType>>
): ResourceResponse<ReturnType>;
function $resource<ReturnType, Params>(
  fn: (params: Params) => Promise<ReturnType>,
  source: Params | (() => Params),
  options?: Partial<ResourceOptions<ReturnType>>
): ResourceResponse<ReturnType>;
function $resource<ReturnType, Params>(
  fn: (params: Params | undefined) => Promise<ReturnType>,
  source?: Params | (() => Params),
  options?: Partial<ResourceOptions<ReturnType>>
): ResourceResponse<ReturnType> {
  const {
    initialValue = null,
    optimisticMutate = true,
    fetchWhen = () => true,
    identifier = Symbol(),
    onError = defaultResourceErrorHandler as OnResourceError<ReturnType>
  } = options ?? {};

  function loadingState(data: ReturnType | null): AsyncData<ReturnType> {
    return {
      data: data,
      loading: true,
      error: null
    };
  }

  let _isInitialLoad = true;
  let _value: ReturnType | null = initialValue;
  let _previousParams: Params | undefined;
  const _signal = $signal<AsyncData<ReturnType>>(loadingState(_value));

  const execute = async () => {
    const derivedSourceFn: () => Params | undefined =
      source instanceof Function ? source : () => source;

    try {
      let data: ReturnType | null = null;
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
      const errorValue = onError(error, _value, { identifier, initialValue })
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
  function mutatorCallback(value: ReturnType | null, error?: unknown): void {
    _value = value;
    _signal.value = {
      data: value,
      loading: false,
      error: error ?? null
    };
  }

  return {
    data: _signal.readOnly,
    mutate: (newValue: ReturnType) => {
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

function isSignal(anything: unknown): anything is Signal<unknown> {
  return (
    !!anything && (anything as Signal<unknown>).brand === SIGNAL_OBJECT_BRAND
  );
}

class Binder<Element extends HTMLElement> {
  constructor(
    private component: Element,
    private propertyName: keyof Element,
  ) {}

  to<T>(signal: Signal<T>) {
    $effect(() => {
      // @ts-expect-error The property name will be found
      this.component[this.propertyName] = signal.value;
    });

    return signal.value;
  }
}

function bind<T extends HTMLElement>(component: T, propertyName: keyof T) {
  return new Binder<T>(component, propertyName);
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

