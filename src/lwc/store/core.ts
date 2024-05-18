type ReadOnlyStore<T> = {
  readonly value: T;
};

type Store<T> = {
  get value(): T;
  set value(newValue: T);
  readOnly: ReadOnlyStore<T>;
};

const context: VoidFunction[] = [];

function _getCurrentObserver(): VoidFunction | undefined {
  return context[context.length - 1];
}

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

function $computed<T>(fn: ComputedFunction<T>): ReadOnlyStore<T> {
  const computedStore: Store<T> = $store(fn());

  $effect(() => {
    computedStore.value = fn();
  });

  return computedStore.readOnly;
}

function $reactTo<T>(store: Store<T>): T {
  let _value: T = store.value;
  $effect(() => {
    _value = store.value;
  });

  return _value;
}

function $store<T>(value: T): Store<T> {
  let _value: T = value;
  const subscribers: Set<VoidFunction> = new Set();

  function getter() {
    const current = _getCurrentObserver();
    if (current) {
      subscribers.add(current);
    }
    return _value;
  }

  function setter(newValue: T) {
    _value = newValue;
    for (const subscriber of subscribers) {
      subscriber();
    }
  }

  return {
    get value() {
      return getter();
    },
    set value(newValue: T) {
      setter(newValue);
    },
    readOnly: {
      get value() {
        return getter();
      }
    }
  };
}

// $resource

type AsyncData<T> = {
  data: T | null;
  loading: boolean;
  error: unknown | null;
};

type ResourceResponse<T> = {
  data: ReadOnlyStore<AsyncData<T>>;
  refetch: () => void;
};

type UnknownArgsMap = { [key: string]: unknown };

type ResourceOptions<T> = {
  initialValue?: T;
};

function $resource<T>(
  fn: (params?: { [key: string]: unknown }) => Promise<T>,
  source?: UnknownArgsMap | (() => UnknownArgsMap),
  options?: ResourceOptions<T>
): ResourceResponse<T> {
  function loadingState(data: T | null): AsyncData<T> {
    return {
      data: data,
      loading: true,
      error: null
    };
  }

  let _isInitialLoad = true;
  let _value: T | null = options?.initialValue ?? null;
  let _previousParams: UnknownArgsMap | undefined;
  const _store = $store<AsyncData<T>>(loadingState(_value));

  const execute = async () => {
    _store.value = loadingState(_value);

    const derivedSource: UnknownArgsMap | undefined =
      source instanceof Function ? source() : source;

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
  };

  $effect(execute);

  return {
    data: _store.readOnly,
    refetch: async () => {
      _isInitialLoad = true;
      await execute();
    }
  };
}

export { $store, $effect, $computed, $reactTo, $resource };
