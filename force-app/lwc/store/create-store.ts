type ReadOnlyStore<T> = {
  readonly value: T;
};

type Store<T> = ReadOnlyStore<T> & {
  value: T;
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
  let newValue: T = computedStore.value;

  $effect(() => {
    newValue = fn();
  });

  return {
    get value() {
      return newValue;
    }
  };
}

// To be used for reactive LWC properties
// This function subscribes to the store and returns the store's current value.
function $rxProp<T>(store: Store<T>, fn: VoidFunction): T {
  $effect(() => {
    fn();
  });

  return store.value;
}

function $rxProp2<T>(store: Store<T>): T {
  $effect(() => {
    console.log(store.value);
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

export { $store, $effect, $computed, $rxProp, $rxProp2 };
