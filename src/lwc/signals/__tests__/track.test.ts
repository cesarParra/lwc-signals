import { $computed, $effect, $signal } from "../core";

describe("a tracked signal", () => {
  test("recomputes when the source is an object that changes", () => {
    const signal = $signal({ a: 0, b: 1 }, { track: true });
    const computed = $computed(() => signal.value.a * 2);
    expect(computed.value).toBe(0);

    signal.value.a = 1;

    expect(computed.value).toBe(2);
  });

  test("recomputes when a nested property of the source object changes", () => {
    const signal = $signal({ a: { b: 0 } }, { track: true });
    const computed = $computed(() => signal.value.a.b * 2);
    expect(computed.value).toBe(0);

    signal.value.a.b = 1;

    expect(computed.value).toBe(2);
  });

  test("recomputes when the source is an array that gets a push", () => {
    const signal = $signal([0], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.push(1);

    expect(computed.value).toBe(2);
  });

  test("recomputes when the source is an array that changes through a pop ", () => {
    const signal = $signal([0], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.pop();

    expect(computed.value).toBe(0);
  });

  test("recomputes when the source is an array that changes through a shift", () => {
    const signal = $signal([0], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.shift();

    expect(computed.value).toBe(0);
  });

  test("recomputes when the source is an array that changes through a splice", () => {
    const signal = $signal([0], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.splice(0, 1);

    expect(computed.value).toBe(0);
  });

  test("recomputes when the source is an array that changes through a reverse", () => {
    const signal = $signal([0, 1], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(2);

    signal.value.reverse();

    expect(computed.value).toBe(2);
  });

  test("recomputes when the source is an array that changes through a sort", () => {
    const signal = $signal([1, 0], { track: true });
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(2);

    signal.value.sort();

    expect(computed.value).toBe(2);
  });

  test("effects when there are updates in an object", () => {
    const signal = $signal({ a: 0 }, { track: true });
    let effectTracker = 0;

    $effect(() => {
      effectTracker = signal.value.a;
    });

    expect(effectTracker).toBe(0);

    signal.value.a = 1;
    expect(effectTracker).toBe(1);
  });

  test("effects when there are updates in an array", () => {
    const signal = $signal([0], { track: true });
    let effectTracker = 0;

    $effect(() => {
      effectTracker = signal.value.length;
    });

    expect(effectTracker).toBe(1);

    signal.value.push(1);
    expect(effectTracker).toBe(2);
  });
});

describe("an untracked signal", () => {
  test("does not recompute when the source is an object that gets updated", () => {
    const signal = $signal({ a: 0 });
    const computed = $computed(() => signal.value.a * 2);
    expect(computed.value).toBe(0);

    signal.value.a = 1;

    expect(computed.value).toBe(0);
  });

  test("does not recompute when the source is an array that gets updated", () => {
    const signal = $signal([0]);
    const computed = $computed(() => signal.value.length);
    expect(computed.value).toBe(1);

    signal.value.push(1);

    expect(computed.value).toBe(1);
  });

  test("does not effect when there are changes to an object", () => {
    const signal = $signal({ a: 0 });
    let effectTracker = 0;

    $effect(() => {
      effectTracker = signal.value.a;
    });

    expect(effectTracker).toBe(0);

    signal.value.a = 1;
    expect(effectTracker).toBe(0);
  });

  test("does not effect to updates in an array", () => {
    const signal = $signal([0]);
    let effectTracker = 0;

    $effect(() => {
      effectTracker = signal.value.length;
    });

    expect(effectTracker).toBe(1);

    signal.value.push(1);
    expect(effectTracker).toBe(1);
  });
});
