type Store<T> = {
  get value(): T;
  set value(newValue: T);
};

const context: VoidFunction[] = [];

function _getCurrentObserver(): VoidFunction | undefined {
  return context[context.length - 1];
}

function $computed<T>(getter: () => T): T {
  const execute = () => {
    context.push(execute);
    try {
      return getter();
    } finally {
      context.pop();
    }
  };

  return execute();
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

export { $store, $computed };
