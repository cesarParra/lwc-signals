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

  test("can create a resource using an async function", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const { data: resource } = $resource(asyncFunction);

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });
  });

  test("can create a resource using an async function with params", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const { data: resource } = $resource(asyncFunction, { source: 1 });

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: 1,
      loading: false,
      error: null
    });
  });

  test("can create a resource using an async function and set an initial value", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const { data: resource } = $resource(asyncFunction, undefined, {
      initialValue: "initial"
    });

    expect(resource.value).toEqual({
      data: "initial",
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });
  });

  test("can create a resource using an async function with a reactive source", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const source = $signal(0);
    const { data: resource } = $resource(asyncFunction, () => ({
      source: source.value
    }));

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: 0,
      loading: false,
      error: null
    });

    source.value = 1;

    expect(resource.value).toEqual({
      data: 0,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: 1,
      loading: false,
      error: null
    });
  });

  test("can mutate a resource", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const { data: resource, mutate } = $resource(asyncFunction);

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });

    mutate("mutated");

    expect(resource.value).toEqual({
      data: "mutated",
      loading: false,
      error: null
    });
  });

  test("does not mutate a resource if optimistic updating is not turned on and no onMutate is provided", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const { data: resource, mutate } = $resource(asyncFunction, undefined, {
      optimisticMutate: false
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });

    mutate("mutated");

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });
  });

  test("can react to a mutation", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    let hasReacted = false;
    const reactionFunction = () => {
      hasReacted = true;
    };

    const { mutate } = $resource(asyncFunction, undefined, {
      onMutate: reactionFunction
    });

    await new Promise(process.nextTick);

    mutate("mutated");

    await new Promise(process.nextTick);

    expect(hasReacted).toBe(true);
  });

  test("can mutate a resource and change the value on success", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const asyncReaction = async (newValue: string, __: string | null, mutate: (value: string | null, error?: unknown) => void) => {
      mutate(`${newValue} - post async success`);
    };

    const { data: resource, mutate } = $resource(asyncFunction, undefined, {
      onMutate: asyncReaction
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });

    mutate("mutated");

    expect(resource.value).toEqual({
      data: "mutated - post async success",
      loading: false,
      error: null
    });
  });

  test("the onMutate function can set an error", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const asyncReaction = async (newValue: string, _: string | null, mutate: (value: string | null, error?: unknown) => void) => {
      mutate(null, "An error occurred");
    };

    const { data: resource, mutate } = $resource(asyncFunction, undefined, {
      onMutate: asyncReaction
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });

    mutate("mutated");

    expect(resource.value).toEqual({
      data: null,
      loading: false,
      error: "An error occurred"
    });
  });

  test("can force a refetch of a resource", async () => {
    let counter = 0;
    const asyncFunction = async () => {
      return counter++;
    };

    const { data: resource, refetch } = $resource(asyncFunction);

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: 0,
      loading: false,
      error: null
    });

    refetch();

    expect(resource.value).toEqual({
      data: 0,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: 1,
      loading: false,
      error: null
    });
  });

  test("when the fetchWhen option is passed, it does not fetch when it evaluates to false", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const source = $signal("changed");
    const { data: resource } = $resource(asyncFunction, () => ({
        source: source.value
      }),
      {
        initialValue: "initial",
        fetchWhen: () => false
      });

    expect(resource.value).toEqual({
      data: "initial",
      loading: false,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "initial",
      loading: false,
      error: null
    });
  });

  test("when the fetchWhen option is passed, it fetches when it evaluates to true", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const source = $signal("changed");
    const { data: resource } = $resource(asyncFunction, () => ({
        source: source.value
      }),
      {
        initialValue: "initial",
        fetchWhen: () => true
      });

    expect(resource.value).toEqual({
      data: "initial",
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "changed",
      loading: false,
      error: null
    });
  });

  test("when the fetchWhen option is passed, it fetches when its value changes to true", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const flagSignal = $signal(false);
    const source = $signal("changed");
    const { data: resource } = $resource(asyncFunction, () => ({
        source: source.value
      }),
      {
        initialValue: "initial",
        fetchWhen: () => flagSignal.value
      });

    expect(resource.value).toEqual({
      data: "initial",
      loading: false,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "initial",
      loading: false,
      error: null
    });

    flagSignal.value = true;

    expect(resource.value).toEqual({
      data: "initial",
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "changed",
      loading: false,
      error: null
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
