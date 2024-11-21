import { $computed, $signal } from "../core";

describe("computed values", () => {
  test("can be created from a source signal", () => {
    const signal = $signal(0);
    const computed = $computed(() => signal.value * 2);

    expect(computed.value).toBe(0);

    signal.value = 1;

    expect(computed.value).toBe(2);
  });

  test("are recomputed when the source is an object and has changes when the signal is being tracked", () => {
    const signal = $signal({ a: 0, b: 1 }, { track: true });
    const computed = $computed(() => signal.value.a * 2);
    expect(computed.value).toBe(0);

    signal.value.a = 1;

    expect(computed.value).toBe(2);
  });

  test("are not recomputed when the source is an object and has changes when the signal is not being tracked", () => {
    const signal = $signal({ a: 0 });
    const computed = $computed(() => signal.value.a * 2);
    expect(computed.value).toBe(0);

    signal.value.a = 1;

    expect(computed.value).toBe(0);
  });

  test("are recomputed when the source is an array with gets a push when the signal is tracked", () => {
    const signal = $signal([0], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.push(1);

    expect(computed.value).toBe(2);
  });

  test("are recomputed when the source is an array that changes through a pop when the signal is tracked", () => {
    const signal = $signal([0], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.pop();

    expect(computed.value).toBe(0);
  });

  test("are recomputed when the source is an array that changes through a shift when the signal is tracked", () => {
    const signal = $signal([0], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.shift();

    expect(computed.value).toBe(0);
  });

  test("are recomputed when the source is an array that changes through a splice when the signal is tracked", () => {
    const signal = $signal([0], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.splice(0, 1);

    expect(computed.value).toBe(0);
  });

  test("are not recomputed when the source is an array with gets a push when the signal is not tracked", () => {
    const signal = $signal([0]);
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.push(1);

    expect(computed.value).toBe(1);
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
});
