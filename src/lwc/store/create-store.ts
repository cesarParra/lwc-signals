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

export { $store, $effect, $computed, $reactTo };
