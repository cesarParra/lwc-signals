import { $signal, $computed, $effect, $resource, Signal } from "../core";
import { createStorage, useCookies, useLocalStorage, useSessionStorage } from "../use";

describe("signals", () => {
  describe("core functionality", () => {
    test("should have a default value", () => {
      const signal = $signal(0);
      expect(signal.value).toBe(0);
    });

    test("should update the value", () => {
      const signal = $signal(0);
      signal.value = 1;
      expect(signal.value).toBe(1);
    });

    test("can derive a computed value", () => {
      const signal = $signal(0);
      const computed = $computed(() => signal.value * 2);
      expect(computed.value).toBe(0);
      signal.value = 1;
      expect(computed.value).toBe(2);
    });

    test("does not recompute when the same value is set", () => {
      const signal = $signal(0);

      let timesComputed = 0;
      const computed = $computed(() => {
        timesComputed++;
        return signal.value * 2;
      });

      expect(computed.value).toBe(0);
      expect(timesComputed).toBe(1);

      signal.value = 1;

      expect(computed.value).toBe(2);
      expect(timesComputed).toBe(2);

      signal.value = 1;

      expect(computed.value).toBe(2);
      expect(timesComputed).toBe(2);
    });

    test("can derive a computed value from another computed value", () => {
      const signal = $signal(0);
      const computed = $computed(() => signal.value * 2);
      const anotherComputed = $computed(() => computed.value * 2);
      expect(anotherComputed.value).toBe(0);

      signal.value = 1;

      expect(computed.value).toBe(2);
      expect(anotherComputed.value).toBe(4);
    });

    test("can create an effect", () => {
      const signal = $signal(0);
      let effectTracker = 0;

      $effect(() => {
        effectTracker = signal.value;
      });

      expect(effectTracker).toBe(0);

      signal.value = 1;
      expect(effectTracker).toBe(1);
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

    test('the onMutate function can set an error', async () => {
      const asyncFunction = async () => {
        return 'done';
      };

      const asyncReaction = async (newValue: string, _: string | null, mutate: (value: string | null, error?: unknown) => void) => {
        mutate(null, 'An error occurred');
      };

      const { data: resource, mutate } = $resource(asyncFunction, undefined, {
        onMutate: asyncReaction
      });

      await new Promise(process.nextTick);

      expect(resource.value).toEqual({
        data: 'done',
        loading: false,
        error: null
      });

      mutate('mutated');

      expect(resource.value).toEqual({
        data: null,
        loading: false,
        error: 'An error occurred'
      });
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
