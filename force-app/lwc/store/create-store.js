const context = [];
function _getCurrentObserver() {
  return context[context.length - 1];
}
function $computed(getter) {
  const execute = () => {
    context.push(execute);
    try {
      getter();
    } finally {
      context.pop();
    }
  };
  execute();
}
function $store(value) {
  let _value = value;
  const subscribers = new Set();
  return {
    get value() {
      const current = _getCurrentObserver();
      if (current) {
        subscribers.add(current);
      }
      return _value;
    },
    set value(newValue) {
      _value = newValue;
      for (const subscriber of subscribers) {
        subscriber();
      }
    }
  };
}
export { $store, $computed };
