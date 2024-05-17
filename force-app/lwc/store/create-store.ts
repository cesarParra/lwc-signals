type Subscriber<T> = (value: T) => void;

type Component = { [key: string]: any };

type Store<T> = {
  value: T;
  subscribe: (subscriber: Subscriber<T>) => void;
  bind: (arg1: Subscriber<T> | Component, key?: string) => T;
};

function $store<T>(initialValue: T): Store<T> {
  let _value = initialValue;
  let subscribers: Subscriber<T>[] = [];

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
    subscribe: (subscriber: Subscriber<T>) => {
      subscribers.push(subscriber);
    },
    bind: (arg1, key) => {
      if (typeof arg1 === "function") {
        subscribers.push(arg1 as Subscriber<T>);
        return _value;
      } else {
        subscribers.push((value) => {
          arg1[key!] = value;
        });
        return _value;
      }
    }
  };
}

export default $store;
