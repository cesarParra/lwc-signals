import {
  Message,
  subscribe,
  unsubscribe as empApiUnsubscribe,
  UnsubscribeResponse,
  isEmpEnabled, SubscribeResponse,
  onError as empApiOnError
} from "lightning/empApi";

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

/**
 * Subscribes to the event bus channel (e.g. platform event, change data capture, etc.).
 * Usage:
 * Pass to the `storage` option of a signal, e.g.:
 * ```javascript
 * import { $signal, useEventBus } from "c/signals";
 * export const receivedEvent = $signal(undefined, {
 *   storage: useEventBus(
 *     "/event/PlatEvent__e",
 *     ({ data }) => ({
 *       message: data.payload.Message__c,
 *       sender: data.payload.Sender__c,
 *       time: data.payload.Time__c
 *     })
 *   )
 * });
 * ```
 * @param channel The event bus channel to subscribe to.
 * @param toValue A function that converts the received message to the desired value.
 * The passed in argument will be the message received from the event bus, which
 * is of the following shape:
 * ```
 * {
 *     channel: string;
 *     data: {
 *       event: {
 *         replayId: number;
 *       },
 *       payload: Record<string, unknown> & { CreatedById: string; CreatedDate: string },
 *     };
 *   }
 * ```
 *
 * The `payload` will contain the actual data of the event. For example,
 * if using a platform event, this will contain the fields of the platform event.
 * @param options (Optional) Additional options.
 * @param options.replayId (Optional) The replay ID to start from. Defaults to -1.
 * When -2 is passed, it will replay from the last saved event.
 * @param options.onSubscribe (Optional) A callback function that's called when the subscription is successful.
 * @param options.onError (Optional) A callback function that's called when an error response is received from the server for
 * handshake, connect, subscribe, and unsubscribe meta channels.
 */
export function useEventBus<T>(channel: string, toValue: (response?: Message) => T, options?: {
  replayId?: number,
  onSubscribe?: (response: SubscribeResponse) => void,
  onError?: (error: unknown) => void
}) {
  return function(value: T) {
    let _value: T = value;
    let _onChange: VoidFunction | undefined;
    let subscription = {};

    const replayId = options?.replayId ?? -1;

    isEmpEnabled().then((enabled) => {
      if (!enabled) {
        console.error(`EMP API is not enabled, cannot subscribe to channel ${channel}`);
        return;
      }

      subscribe(channel, replayId, (response?: Message) => {
        _value = toValue(response);
        _onChange?.();
      }).then((sub) => {
        subscription = sub;
        options?.onSubscribe?.(sub);
      });

      empApiOnError((error) => {
        options?.onError?.(error);
      });
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
  };
}
