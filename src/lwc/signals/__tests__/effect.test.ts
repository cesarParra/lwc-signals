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
});
