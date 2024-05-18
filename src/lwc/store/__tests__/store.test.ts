import { $store, $computed, $effect } from "../store";

describe("store", () => {
  test("should have a default value", () => {
    const store = $store(0);
    expect(store.value).toBe(0);
  });

  test("should update the value", () => {
    const store = $store(0);
    store.value = 1;
    expect(store.value).toBe(1);
  });

  test("can derive a computed value", () => {
    const store = $store(0);
    const computed = $computed(() => store.value * 2);
    expect(computed.value).toBe(0);
    store.value = 1;
    expect(computed.value).toBe(2);
  });

  test("can derive a computed value from another computed value", () => {
    const store = $store(0);
    const computed = $computed(() => store.value * 2);
    const anotherComputed = $computed(() => computed.value * 2);
    expect(anotherComputed.value).toBe(0);
    store.value = 1;
    expect(computed.value).toBe(2);
    expect(anotherComputed.value).toBe(4);
  });

  test("can create an effect", () => {
    const store = $store(0);
    let effectTracker = 0;

    $effect(() => {
      effectTracker = store.value;
    });

    expect(effectTracker).toBe(0);

    store.value = 1;
    expect(effectTracker).toBe(1);
  });
});
