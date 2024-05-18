type Store<T> = {
  get value(): T;
  set value(newValue: T);
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

function $computed<T>(fn: ComputedFunction<T>): Store<T> {
  const computedStore: Store<T> = $store(fn());

  $effect(() => {
    computedStore.value = fn();
  });

  return computedStore;
}

function $reactTo<T>(store: Store<T>): T {
  $effect(() => {
    // Simply access the store to subscribe to it
    store.value;
  });

  return store.value;
}

function $store<T>(value: T): Store<T> {
  let _value: T = value;
  const subscribers: Set<VoidFunction> = new Set();

  return {
    get value() {
      const current = _getCurrentObserver();
      if (current) {
        subscribers.add(current);
      }
      return _value;
    },
    set value(newValue: T) {
      _value = newValue;
      for (const subscriber of subscribers) {
        subscriber();
      }
    }
  };
}

export { $store, $effect, $computed, $reactTo };
