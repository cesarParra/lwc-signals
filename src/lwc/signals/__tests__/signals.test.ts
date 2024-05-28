import { $signal, $computed, $effect, $resource, Signal } from "../core";
import { createStorage, useCookies, useLocalStorage } from "../use";

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
          },
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
});
