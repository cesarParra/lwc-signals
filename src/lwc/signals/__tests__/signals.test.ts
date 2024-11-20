import { $signal, $resource, Signal } from "../core";
import { createStorage, useCookies, useEventBus, useLocalStorage, useSessionStorage } from "../use";
import { jestMockPublish } from "../../../__mocks__/lightning/empApi";

describe("signals", () => {
  test("contain the passed value by default", () => {
    const signal = $signal(0);
    expect(signal.value).toBe(0);
  });

  test("update their value when a new one is set", () => {
    const signal = $signal(0);
    signal.value = 1;
    expect(signal.value).toBe(1);
  });

  test("delay changing their value when debounced", async () => {
    const debouncedSignal = $signal(0, {
      debounce: 100
    });

    debouncedSignal.value = 1;

    expect(debouncedSignal.value).toBe(0);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(debouncedSignal.value).toBe(1);
  });
});

test("can create custom storages", () => {
  const useUndo = <T>(value: T) => {
    const _valueStack: T[] = [];

    // add the initial value to the stack
    _valueStack.push(value);

    function undo() {
      _valueStack.pop();
    }

    const customStorage = createStorage(
      () => {
        // Get value at the top of the stack
        return _valueStack[_valueStack.length - 1];
      },
      (newValue) => {
        _valueStack.push(newValue);
      }
    );

    return {
      ...customStorage,
      undo
    };
  };

  const signal = $signal(0, {
    storage: useUndo
  }) as unknown as Signal<number> & { undo: () => void };

  expect(signal.value).toBe(0);

  signal.value = 1;
  expect(signal.value).toBe(1);

  signal.value = 2;
  expect(signal.value).toBe(2);

  signal.undo();
  expect(signal.value).toBe(1);

  signal.undo();
  expect(signal.value).toBe(0);
});

describe("storing values in local storage", () => {
  test("should have a default value", () => {
    const signal = $signal(0, {
      storage: useLocalStorage("test")
    });
    expect(signal.value).toBe(0);
  });

  test("should update the value", () => {
    const signal = $signal(0);
    signal.value = 1;
    expect(signal.value).toBe(1);
  });
});

describe("storing values in session storage", () => {
  test("should have a default value", () => {
    const signal = $signal(0, {
      storage: useSessionStorage("test")
    });
    expect(signal.value).toBe(0);
  });

  test("should update the value", () => {
    const signal = $signal(0);
    signal.value = 1;
    expect(signal.value).toBe(1);
  });
});

describe("storing values in cookies", () => {
  test("should have a default value", () => {
    const signal = $signal(0, {
      storage: useCookies("test")
    });
    expect(signal.value).toBe(0);
  });

  test("should update the value", () => {
    const signal = $signal(0, {
      storage: useCookies("test")
    });
    signal.value = 1;
    expect(signal.value).toBe(1);
  });
});

describe("when receiving a value from the empApi", () => {
  it("should update the signal when the message is received", async () => {
    function handleEvent(event?: { data: { payload: Record<string, unknown> } }) {
      return event?.data.payload.Message__c ?? "";
    }

    const signal = $signal("", {
      storage: useEventBus("/event/TestChannel__e", handleEvent)
    });

    await new Promise(process.nextTick);

    expect(signal.value).toBe("");

    await jestMockPublish("/event/TestChannel__e", {
      data: {
        payload: {
          Message__c: "Hello World!"
        }
      }
    });

    await new Promise(process.nextTick);

    expect(signal.value).toBe("Hello World!");
  });
});
