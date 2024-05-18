import { $store, $computed, $effect, $resource } from "../store";

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

  test("can create a resource using an async function", async () => {
    const asyncFunction = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return "done";
    };

    const resource = $resource(asyncFunction);

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });
  });

  test("can create a resource using an async function with a reactive source", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return params?.["source"];
    };

    const source = $store(0);
    const resource = $resource(asyncFunction, () => ({ source: source.value }));

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(resource.value).toEqual({
      data: 0,
      loading: false,
      error: null
    });

    source.value = 1;

    expect(resource.value).toEqual({
      data: 0,
      loading: true,
      error: null
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(resource.value).toEqual({
      data: 1,
      loading: false,
      error: null
    });
  });
});
