import {
  subscribe,
  unsubscribe as empApiUnsubscribe,
  isEmpEnabled
} from "lightning/empApi";
export function createStorage(get, set, registerOnChange, unsubscribe) {
  return { get, set, registerOnChange, unsubscribe };
}
export function useInMemoryStorage(value) {
  let _value = value;
  function getter() {
    return _value;
  }
  function setter(newValue) {
    _value = newValue;
  }
  return createStorage(getter, setter);
}
function useLocalStorageCreator(key, value) {
  function getter() {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
    return value;
  }
  function setter(newValue) {
    localStorage.setItem(key, JSON.stringify(newValue));
  }
  // Set initial value if not set
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  return createStorage(getter, setter);
}
export function useLocalStorage(key) {
  return function (value) {
    return useLocalStorageCreator(key, value);
  };
}
function useSessionStorageCreator(key, value) {
  function getter() {
    const item = sessionStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
    return value;
  }
  function setter(newValue) {
    sessionStorage.setItem(key, JSON.stringify(newValue));
  }
  // Set initial value if not set
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
  return createStorage(getter, setter);
}
export function useSessionStorage(key) {
  return function (value) {
    return useSessionStorageCreator(key, value);
  };
}
export function useCookies(key, expires) {
  return function (value) {
    function getter() {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(key));
      if (cookie) {
        const value = cookie.replace(`${key}=`, "");
        return JSON.parse(value);
      }
      return value;
    }
    function setter(newValue) {
      document.cookie = `${key}=${JSON.stringify(newValue)}; expires=${expires?.toUTCString()}`;
    }
    return createStorage(getter, setter);
  };
}
export function useEventListener(type) {
  return function (value) {
    let _value = value;
    let _onChange;
    window.addEventListener(type, (event) => {
      const e = event;
      _value = e.detail.data;
      if (e.detail.sender !== "__internal__") {
        _onChange?.();
      }
    });
    function getter() {
      return _value;
    }
    function setter(newValue) {
      _value = newValue;
      window.dispatchEvent(
        new CustomEvent(type, {
          detail: {
            data: newValue,
            sender: "__internal__"
          }
        })
      );
    }
    function registerOnChange(onChange) {
      _onChange = onChange;
    }
    return createStorage(getter, setter, registerOnChange);
  };
}
// TODO: Document through JSDocs
// TODO: Document in README
export function useEventBus(channel, toValue, options) {
  return function (value) {
    let _value = value;
    let _onChange;
    let subscription = {};
    const replayId = options?.replayId ?? -1;
    isEmpEnabled().then((enabled) => {
      if (!enabled) {
        console.error(
          `EMP API is not enabled, cannot subscribe to channel ${channel}`
        );
        return;
      }
      subscribe(channel, replayId, (response) => {
        _value = toValue(response);
        _onChange?.();
      }).then((sub) => {
        subscription = sub;
        options?.onSubscribe?.(sub);
      });
    });
    function getter() {
      return _value;
    }
    function setter(newValue) {
      _value = newValue;
    }
    function registerOnChange(onChange) {
      _onChange = onChange;
    }
    function unsubscribe(callback) {
      empApiUnsubscribe(subscription, callback);
    }
    return createStorage(getter, setter, registerOnChange, unsubscribe);
  };
}
