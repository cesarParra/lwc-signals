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
};

const context: VoidFunction[] = [];

function _getCurrentObserver(): VoidFunction | undefined {
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
function $effect(fn: VoidFunction): void {
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

type ComputedFunction<T> = () => T;

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
function $computed<T>(fn: ComputedFunction<T>): ReadOnlySignal<T> {
  // The initial value is undefined, as it will be computed
  // when the effect runs for the first time
  const computedSignal: Signal<T | undefined> = $signal(undefined);

  $effect(() => {
    computedSignal.value = fn();
  });

  return computedSignal.readOnly as ReadOnlySignal<T>;
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
    if (isEqual(newValue, _storageOption.get())) {
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
};

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
  function loadingState(data: ReturnType | null): AsyncData<ReturnType> {
    return {
      data: data,
      loading: true,
      error: null
    };
  }

  let _isInitialLoad = true;
  let _value: ReturnType | null = options?.initialValue ?? null;
  let _previousParams: Params | undefined;
  const _signal = $signal<AsyncData<ReturnType>>(loadingState(_value));
  // Optimistic updates are enabled by default
  const _optimisticMutate = options?.optimisticMutate ?? true;
  const _fetchWhen = options?.fetchWhen ?? (() => true);

  const execute = async () => {
    const derivedSourceFn: () => Params | undefined =
      source instanceof Function ? source : () => source;

    try {
      let data: ReturnType | null = null;
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
