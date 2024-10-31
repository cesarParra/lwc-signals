import { Message, subscribe, unsubscribe as empApiUnsubscribe, UnsubscribeResponse } from "lightning/empApi";

export type State<T> = {
  get: () => T;
  set: (newValue: T) => void;
  registerOnChange?: (f: VoidFunction) => void;
  unsubscribe?: () => void;
}

export function createStorage<T>(
  get: () => T,
  set: (newValue: T) => void,
  registerOnChange?: (f: VoidFunction) => void,
  unsubscribe?: () => void
): State<T> {
  return { get, set, registerOnChange, unsubscribe };
}

export function useInMemoryStorage<T>(value: T): State<T> {
  let _value: T = value;

  function getter() {
    return _value;
  }

  function setter(newValue: T) {
    _value = newValue;
  }

  return createStorage(getter, setter);
}

function useLocalStorageCreator<T>(key: string, value: T): State<T> {
  function getter() {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
    return value;
  }

  function setter(newValue: T) {
    localStorage.setItem(key, JSON.stringify(newValue));
  }

  // Set initial value if not set
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  return createStorage(getter, setter);
}

export function useLocalStorage(key: string) {
  return function <T>(value: T) {
    return useLocalStorageCreator(key, value);
  };
}

function useSessionStorageCreator<T>(key: string, value: T): State<T> {
  function getter() {
    const item = sessionStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
    return value;
  }

  function setter(newValue: T) {
    sessionStorage.setItem(key, JSON.stringify(newValue));
  }

  // Set initial value if not set
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  return createStorage(getter, setter);
}

export function useSessionStorage(key: string) {
  return function <T>(value: T) {
    return useSessionStorageCreator(key, value);
  };
}

export function useCookies<T>(key: string, expires?: Date) {
  return function(value: T) {
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

    function setter(newValue: T) {
      document.cookie = `${key}=${JSON.stringify(newValue)}; expires=${expires?.toUTCString()}`;
    }

    return createStorage(getter, setter);
  };
}

type UseEventListenerEvent<T> = CustomEvent<{ data: T, sender?: string }>;

export function useEventListener<T, K extends keyof DocumentEventMap>(
  type: K
) {
  return function(value: T) {
    let _value: T = value;
    let _onChange: VoidFunction | undefined;

    window.addEventListener(type, (event) => {
      const e = event as UseEventListenerEvent<T>;
      _value = e.detail.data;
      if (e.detail.sender !== "__internal__") {
        _onChange?.();
      }
    });

    function getter() {
      return _value;
    }

    function setter(newValue: T) {
      _value = newValue;
      window.dispatchEvent(new CustomEvent(type, {
        detail: {
          data: newValue,
          sender: "__internal__"
        }
      }));
    }

    function registerOnChange(onChange: VoidFunction) {
      _onChange = onChange;
    }

    return createStorage(getter, setter, registerOnChange);
  };
}

// TODO: Document through JSDocs
// TODO: Document in README
// TODO: Pass a subscription callback
export function useEventBus<T>(channel: string, toValue: (response?: Message) => T, replayId: number = -1) {
  return function(value: T) {
    let _value: T = value;
    let _onChange: VoidFunction | undefined;
    let subscription = {};

    // TODO: Check if the empApi is available
    subscribe(channel, replayId, (response?: Message) => {
      _value = toValue(response);
      _onChange?.();
    }).then((sub) => {
      subscription = sub;
      console.log(subscription);
    });

    function getter() {
      return _value;
    }

    function setter(newValue: T) {
      _value = newValue;
    }

    function registerOnChange(onChange: VoidFunction) {
      _onChange = onChange;
    }

    function unsubscribe(callback?: (response?: UnsubscribeResponse) => void) {
      empApiUnsubscribe(subscription, callback);
    }

    return createStorage(getter, setter, registerOnChange, unsubscribe);
  }
}
