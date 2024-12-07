import { $signal, isSignal } from "../core";

describe("isASignal", () => {
  test("checks that a value is a signal", () => {
    const signal = $signal(0);
    expect(isSignal(signal)).toBe(true);
  });

  test("checks that a computed is a signal", () => {
    const signal = $signal(0);
    const computed = $signal(() => signal.value);
    expect(isSignal(computed)).toBe(true);
  });

  test("checks that a value is not a signal", () => {
    expect(isSignal(0)).toBe(false);
  });

  test("checks that a function is not a signal", () => {
    expect(isSignal(() => {})).toBe(false);
  });

  test("checks that an object is not a signal", () => {
    expect(isSignal({})).toBe(false);
  });

  test("checks that an array is not a signal", () => {
    expect(isSignal([])).toBe(false);
  });

  test("checks that undefined is not a signal", () => {
    expect(isSignal(undefined)).toBe(false);
  });

  test("checks that null is not a signal", () => {
    expect(isSignal(null)).toBe(false);
  });
});
