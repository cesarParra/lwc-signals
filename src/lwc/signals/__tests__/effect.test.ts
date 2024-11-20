import { $signal, $effect } from "../core";

describe("effects", () => {
  test("react to updates in a signal", () => {
    const signal = $signal(0);
    let effectTracker = 0;

    $effect(() => {
      effectTracker = signal.value;
    });

    expect(effectTracker).toBe(0);

    signal.value = 1;
    expect(effectTracker).toBe(1);
  });

  test("react to updates in an object signal", () => {
    const signal = $signal({ a: 0 });
    let effectTracker = 0;

    $effect(() => {
      effectTracker = signal.value.a;
    });

    expect(effectTracker).toBe(0);

    signal.value.a = 1;
    expect(effectTracker).toBe(1);
  });

  test("react to updates in an array signal that gets a push", () => {
    const signal = $signal([0]);
    let effectTracker = 0;

    $effect(() => {
      effectTracker = signal.value.length;
    });

    expect(effectTracker).toBe(1);

    signal.value.push(1);
    expect(effectTracker).toBe(2);
  });
});
