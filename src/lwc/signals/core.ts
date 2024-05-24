type ReadOnlySignal<T> = {
  readonly value: T;
};

type Signal<T> = {
  get value(): T;
  set value(newValue: T);
  readOnly: ReadOnlySignal<T>;
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

function $computed<T>(fn: ComputedFunction<T>): ReadOnlySignal<T> {
  const computedSignal: Signal<T> = $signal(fn());

  $effect(() => {
    computedSignal.value = fn();
  });

  return computedSignal.readOnly;
}

function $signal<T>(value: T): Signal<T> {
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
  data: ReadOnlySignal<AsyncData<T>>;
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
  const _signal = $signal<AsyncData<T>>(loadingState(_value));

  const execute = async () => {
    _signal.value = loadingState(_value);

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
