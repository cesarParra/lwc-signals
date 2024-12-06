import { $computed, $effect, $signal } from "../core";

describe("computed values", () => {
  test("can be created from a source signal", () => {
    const signal = $signal(0);
    const computed = $computed(() => signal.value * 2);

    expect(computed.value).toBe(0);

    signal.value = 1;

    expect(computed.value).toBe(2);
  });

  test("do not recompute when the same value is set in the source signal", () => {
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

  test("can be created from another computed value", () => {
    const signal = $signal(0);
    const computed = $computed(() => signal.value * 2);
    const anotherComputed = $computed(() => computed.value * 2);
    expect(anotherComputed.value).toBe(0);

    signal.value = 1;

    expect(computed.value).toBe(2);
    expect(anotherComputed.value).toBe(4);
  });

  test("computed objects that return the same value as a tracked signal recomputes", () => {
    const signal = $signal({ a: 0, b: 0 }, { track: true });
    const computed = $computed(() => signal.value);
    const spy = jest.fn(() => computed.value);
    $effect(spy);
    spy.mockReset();

    signal.value.a = 1;
    expect(spy).toHaveBeenCalled();
  });

  test("throw an error when a circular dependency is detected", () => {
    console.error = jest.fn();
    expect(() => {
      const signal = $signal(0);
      $computed(() => {
        signal.value = signal.value++;
        return signal.value;
      });
    }).toThrow();
  });

  test("console errors when a computed throws an error", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const signal = $signal(0);
      $computed(() => {
        signal.value;
        throw new Error("error");
      });
      signal.value = 1;
    } catch (e) {
      expect(spy).toHaveBeenCalled();
    }

    spy.mockRestore();
  });

  test("have a default identifier", () => {
    const computed = $computed(() => {});
    expect(computed.identifier).toBeDefined();
  });

  test("console errors with an identifier when one was provided", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const signal = $signal(0);
      $computed(() => {
        signal.value;
        throw new Error("error");
      }, { identifier: "test-identifier" });
      signal.value = 1;
    } catch (e) {
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("test-identifier"), expect.any(Error));
    }

    spy.mockRestore();
  });

  test("allow for errors to be handled through a custom function", () => {
    const customErrorHandlerFn = jest.fn() as (error: unknown) => void;

    $computed(() => {
      throw new Error("test");
    }, {
      errorHandler: customErrorHandlerFn
    });

    expect(customErrorHandlerFn).toHaveBeenCalled();
  });

  test("allow for errors to be handled through a custom function and return a fallback value", () => {
    function customErrorHandlerFn() {
      return "fallback";
    }

    const computed = $computed(() => {
      throw new Error("test");
    }, {
      errorHandler: customErrorHandlerFn
    });

    expect(computed.value).toBe("fallback");
  });

  test("allows for custom error handlers to return the previous value", () => {
    const signal = $signal(0);
    function customErrorHandlerFn(_error: unknown, previousValue: number | undefined) {
      return previousValue;
    }

    const computed = $computed(() => {
      if (signal.value === 2) {
        throw new Error("test");
      }

      return signal.value;
    }, {
      errorHandler: customErrorHandlerFn
    });

    expect(computed.value).toBe(0);

    signal.value = 1;

    expect(computed.value).toBe(1)

    signal.value = 2;

    expect(computed.value).toBe(1);
  });
});
