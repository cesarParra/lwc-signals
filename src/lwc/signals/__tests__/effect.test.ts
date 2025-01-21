import { $signal, $effect } from "../core";

describe("effects", () => {
  test("react to the callback immediately", () => {
    const signal = $signal(0);
    const spy = jest.fn(() => signal.value);
    $effect(spy);
    expect(spy).toHaveBeenCalled();
  });

  test("react to updates in a signal", () => {
    const signal = $signal(0);
    const spy = jest.fn(() => signal.value);
    $effect(spy);
    spy.mockReset();

    signal.value = 1;
    expect(spy).toHaveBeenCalled();
  });

  test("react to updates in multiple signals", () => {
    const a = $signal(0);
    const b = $signal(0);
    const spy = jest.fn(() => a.value + b.value);
    $effect(spy);
    spy.mockReset();

    a.value = 1;
    b.value = 1;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test("throw an error when a circular dependency is detected", () => {
    console.error = jest.fn();
    expect(() => {
      const signal = $signal(0);
      $effect(() => {
        signal.value = signal.value++;
      });
    }).toThrow();
  });

  test("return an object with an identifier", () => {
    const effect = $effect(() => {});
    expect(effect.identifier).toBeDefined();
  });

  test("console errors when an effect throws an error", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      $effect(() => {
        throw new Error("test");
      });
    } catch (error) {
      expect(spy).toHaveBeenCalled();
    }
    spy.mockRestore();
  });

  test("console errors with the default identifier", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const signal = $signal(0);
    const effect = $effect(() => {
      if (signal.value === 1) {
        throw new Error("test");
      }
    });

    try {
      signal.value = 1;
    } catch (e) {
      expect(spy).toHaveBeenCalledWith(expect.stringContaining(effect.identifier.toString()), expect.any(Error));
    }

    spy.mockRestore();
  });

  test("allow for the identifier to be overridden", () => {
    const signal = $signal(0);
    const effect = $effect(() => {
      if (signal.value === 1) {
        throw new Error("test");
      }
    }, {
      identifier: "test-identifier"
    });

    expect(effect.identifier).toBe("test-identifier");
  });

  test("console errors with a custom identifier if provided", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const signal = $signal(0);
    $effect(() => {
      if (signal.value === 1) {
        throw new Error("test");
      }
    }, {
      identifier: "test-identifier"
    });

    try {
      signal.value = 1;
    } catch (e) {
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("test-identifier"), expect.any(Error));
    }

    spy.mockRestore();
  });

  test("allow for errors to be handled through a custom function", () => {
    const customErrorHandlerFn = jest.fn();
    $effect(() => {
      throw new Error("test");
    }, {
      onError: customErrorHandlerFn
    });

    expect(customErrorHandlerFn).toHaveBeenCalled();
  });

  test("give access to the effect identifier in the onError handler", () => {
    function customErrorHandler(_error: unknown, options: { identifier: string | symbol }) {
      expect(options.identifier).toBe("test-identifier");
    }

    $effect(() => {
      throw new Error("test");
    }, {
      identifier: "test-identifier",
      onError: customErrorHandler
    });
  });

  test("can change and read a signal value without causing a cycle by peeking at it", () => {
    const counter = $signal(0);
    $effect(() => {
      // Without peeking, this kind of operation would cause a circular dependency.
      counter.value = counter.peek() + 1;
    });

    expect(counter.value).toBe(1);
  });

  test("throws error when circular dependency exceeds depth limit", () => {
    const signal = $signal(0);
  
    expect(() => {
      $effect(() => {
        signal.value = signal.value + 1;
      });
    }).toThrow(/Circular dependency detected. Maximum stack depth of \d+ exceeded./);
  });
});
