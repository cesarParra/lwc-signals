import { $signal, isASignal } from "../core";

describe("isASignal", () => {
  test("checks that a value is a signal", () => {
    const signal = $signal(0);
    expect(isASignal(signal)).toBe(true);
  });

  test("checks that a computed is a signal", () => {
    const signal = $signal(0);
    const computed = $signal(() => signal.value);
    expect(isASignal(computed)).toBe(true);
  });

  test("checks that a value is not a signal", () => {
    expect(isASignal(0)).toBe(false);
  });

  test("checks that a function is not a signal", () => {
    expect(isASignal(() => {})).toBe(false);
  });

  test("checks that an object is not a signal", () => {
    expect(isASignal({})).toBe(false);
  });

  test("checks that an array is not a signal", () => {
    expect(isASignal([])).toBe(false);
  });

  test("checks that undefined is not a signal", () => {
    expect(isASignal(undefined)).toBe(false);
  });

  test("checks that null is not a signal", () => {
    expect(isASignal(null)).toBe(false);
  });
});
