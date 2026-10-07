import {
  createStorage,
  State,
  useCookies,
  useEventBus,
  useLocalStorage,
  useSessionStorage
} from "../use";
import { $signal, Signal } from "../core";
import { jestMockPublish } from "../../../__mocks__/lightning/empApi";

test("signals can be expanded with a user created custom storages", () => {
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

describe("when storing a value in local storage", () => {
  it("has a default value", () => {
    const signal = $signal(0, {
      storage: useLocalStorage("test")
    });
    expect(signal.value).toBe(0);
  });

  it("allows you to update the value", () => {
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
    function handleEvent(event?: {
      data: { payload: Record<string, unknown> };
    }) {
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

describe("stored values that do not parse", () => {
  type Case = [
    string,
    (key: string) => (value: unknown) => State<unknown>,
    (key: string, raw: string) => void
  ];
  const cases: Case[] = [
    ["local storage", useLocalStorage, (k, v) => localStorage.setItem(k, v)],
    [
      "session storage",
      useSessionStorage,
      (k, v) => sessionStorage.setItem(k, v)
    ],
    ["cookies", (k) => useCookies(k), (k, v) => (document.cookie = `${k}=${v}`)]
  ];

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe.each(cases)("in %s", (_name, use, write) => {
    test("fall back to the default instead of throwing", () => {
      write("poisoned", "undefined");
      const signal = $signal<unknown>("default", { storage: use("poisoned") });
      expect(signal.value).toBe("default");
    });

    test("can still be written", () => {
      write("poisoned-write", "{not json");
      const signal = $signal<unknown>("default", {
        storage: use("poisoned-write")
      });
      expect(() => (signal.value = "next")).not.toThrow();
      expect(signal.value).toBe("next");
    });

    test("survive undefined being written through the signal", () => {
      const signal = $signal<unknown>("default", {
        storage: use("written-undefined")
      });
      signal.value = undefined;
      const reloaded = $signal<unknown>("default", {
        storage: use("written-undefined")
      });
      expect(() => reloaded.value).not.toThrow();
    });
  });
});
