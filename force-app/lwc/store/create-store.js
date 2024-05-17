function $store(initialValue) {
  let _value = initialValue;
  let subscribers = [];
  function notify() {
    for (let subscriber of subscribers) {
      subscriber(_value);
    }
  }
  return {
    get value() {
      return _value;
    },
    set value(v) {
      _value = v;
      notify();
    },
    subscribe: (subscriber) => {
      subscribers.push(subscriber);
    },
    bind: (arg1, key) => {
      if (typeof arg1 === "function") {
        subscribers.push(arg1);
        return _value;
      } else {
        subscribers.push((value) => {
          arg1[key] = value;
        });
        return _value;
      }
    }
  };
}
export default $store;
