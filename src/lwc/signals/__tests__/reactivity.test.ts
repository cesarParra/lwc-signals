import { $effect, $signal } from "../core";

beforeAll(() => {
  global.console = {
    ...console,
    log: jest.fn(), // Mock console.log
  };
});

describe("a signal holding a simple value", () => {
  test("is reactive when their value changes", () => {
    const signal = $signal(0);
    let effectAmount = 0;
    $effect(() => {
      console.log(signal.value);
      effectAmount++;
    });
    expect(effectAmount).toBe(1);

    signal.value = 1;

    expect(effectAmount).toBe(2);
  });

  test("is reactive when their value changes multiple times", () => {
    const signal = $signal(0);
    let effectAmount = 0;
    $effect(() => {
      console.log(signal.value);
      effectAmount++;
    });
    expect(effectAmount).toBe(1);

    signal.value = 1;
    signal.value = 2;
    signal.value = 3;

    expect(effectAmount).toBe(4);
  });

  test("is not reactive when their value is set to the same value", () => {
    const signal = $signal(0);
    let effectAmount = 0;
    $effect(() => {
      console.log(signal.value);
      effectAmount++;
    });
    expect(effectAmount).toBe(1);

    signal.value = 0;

    expect(effectAmount).toBe(1);
  });
});

describe("a signal holding an object", () => {
  test("is reactive when the object changes", () => {
    const signal = $signal({ count: 0 });
    let effectAmount = 0;
    $effect(() => {
      console.log(signal.value.count);
      effectAmount++;
    });
    expect(effectAmount).toBe(1);

    signal.value = { count: 1 };

    expect(effectAmount).toBe(2);
  });

  test("is not reactive when the object is set to the same shape", () => {
    const signal = $signal({ count: 0 });
    let effectAmount = 0;
    $effect(() => {
      console.log(signal.value.count);
      effectAmount++;
    });
    expect(effectAmount).toBe(1);

    signal.value = { count: 0 };

    expect(effectAmount).toBe(1);
  });
});

describe("a signal holding an array", () => {
  test("is reactive when the array changes", () => {
    const signal = $signal([0]);
    let effectAmount = 0;
    $effect(() => {
      console.log(signal.value[0]);
      effectAmount++;
    });
    expect(effectAmount).toBe(1);

    signal.value = [1];

    expect(effectAmount).toBe(2);
  });

  test("is not reactive when the array is set to the same shape", () => {
    const signal = $signal([0]);
    let effectAmount = 0;
    $effect(() => {
      console.log(signal.value[0]);
      effectAmount++;
    });
    expect(effectAmount).toBe(1);

    signal.value = [0];

    expect(effectAmount).toBe(1);
  });
});
