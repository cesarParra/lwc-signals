import { $computed, $signal } from "../core";

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

  // test("throws an error when a circular dependency is detected", () => {
  //   const signal = $signal(0);
  //   const computed = $computed(() => signal.value * 2);
  //   const computed2 = $computed(() => computed.value + 1);
  //
  //   // TODO
  //
  // });
});
