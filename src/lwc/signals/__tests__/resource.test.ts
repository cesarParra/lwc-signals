/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { $resource, $signal, $computed, $effect } from "../core";

describe("resources", () => {
  test("can can be created by providing an async function", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const { data: resource } = $resource(asyncFunction);

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });
  });

  test("can pass along parameters to the provided function", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const { data: resource } = $resource(asyncFunction, { source: 1 });

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: 1,
      loading: false,
      error: null
    });
  });

  test("can be created with an initial value", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const { data: resource } = $resource(asyncFunction, undefined, {
      initialValue: "initial"
    });

    expect(resource.value).toEqual({
      data: "initial",
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });
  });

  test("get reevaluated when a reactive source is provided", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const source = $signal(0);
    const { data: resource } = $resource(asyncFunction, () => ({
      source: source.value
    }));

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

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

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: 1,
      loading: false,
      error: null
    });
  });

  test("can be mutated", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const { data: resource, mutate } = $resource(asyncFunction);

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });

    mutate("mutated");

    expect(resource.value).toEqual({
      data: "mutated",
      loading: false,
      error: null
    });
  });

  test("are not reevaluated when optimistic updating is not turned on and no onMutate is provided", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const { data: resource, mutate } = $resource(asyncFunction, undefined, {
      optimisticMutate: false
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });

    mutate("mutated");

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });
  });

  test("react to a mutation", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    let hasReacted = false;
    const reactionFunction = () => {
      hasReacted = true;
    };

    const { mutate } = $resource(asyncFunction, undefined, {
      onMutate: reactionFunction
    });

    await new Promise(process.nextTick);

    mutate("mutated");

    await new Promise(process.nextTick);

    expect(hasReacted).toBe(true);
  });

  test("can be mutated and change the value on success", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const asyncReaction = async (
      newValue: string,
      __: string | null,
      mutate: (value: string | null, error?: unknown) => void
    ) => {
      mutate(`${newValue} - post async success`);
    };

    const { data: resource, mutate } = $resource(asyncFunction, undefined, {
      onMutate: asyncReaction
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });

    mutate("mutated");

    expect(resource.value).toEqual({
      data: "mutated - post async success",
      loading: false,
      error: null
    });
  });

  test("can be provided a callback on mutate that can set errors", async () => {
    const asyncFunction = async () => {
      return "done";
    };

    const asyncReaction = async (
      newValue: string,
      _: string | null,
      mutate: (value: string | null, error?: unknown) => void
    ) => {
      mutate(null, "An error occurred");
    };

    const { data: resource, mutate } = $resource(asyncFunction, undefined, {
      onMutate: asyncReaction
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "done",
      loading: false,
      error: null
    });

    mutate("mutated");

    expect(resource.value).toEqual({
      data: null,
      loading: false,
      error: "An error occurred"
    });
  });

  test("can be forced to reevaluate", async () => {
    let counter = 0;
    const asyncFunction = async () => {
      return counter++;
    };

    const { data: resource, refetch } = $resource(asyncFunction);

    expect(resource.value).toEqual({
      data: null,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: 0,
      loading: false,
      error: null
    });

    refetch();

    expect(resource.value).toEqual({
      data: 0,
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: 1,
      loading: false,
      error: null
    });
  });

  test("does not fetch when a fetchWhen option is passed that evaluates to false", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const source = $signal("changed");
    const { data: resource } = $resource(
      asyncFunction,
      () => ({
        source: source.value
      }),
      {
        initialValue: "initial",
        fetchWhen: () => false
      }
    );

    expect(resource.value).toEqual({
      data: "initial",
      loading: false,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "initial",
      loading: false,
      error: null
    });
  });

  test("fetches when a fetchWhen option is passed that evaluates to true", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const source = $signal("changed");
    const { data: resource } = $resource(
      asyncFunction,
      () => ({
        source: source.value
      }),
      {
        initialValue: "initial",
        fetchWhen: () => true
      }
    );

    expect(resource.value).toEqual({
      data: "initial",
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "changed",
      loading: false,
      error: null
    });
  });

  test("fetches when the fetchWhen option is passed reevaluates to true", async () => {
    const asyncFunction = async (params?: { [key: string]: unknown }) => {
      return params?.["source"];
    };

    const flagSignal = $signal(false);
    const source = $signal("changed");
    const { data: resource } = $resource(
      asyncFunction,
      () => ({
        source: source.value
      }),
      {
        initialValue: "initial",
        fetchWhen: () => flagSignal.value
      }
    );

    expect(resource.value).toEqual({
      data: "initial",
      loading: false,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "initial",
      loading: false,
      error: null
    });

    flagSignal.value = true;

    expect(resource.value).toEqual({
      data: "initial",
      loading: true,
      error: null
    });

    await new Promise(process.nextTick);

    expect(resource.value).toEqual({
      data: "changed",
      loading: false,
      error: null
    });
  });
});

test("times called", async () => {
  const sourceAsync = async () => {
    return "done";
  };

  const asyncFunction = async (source: string | null) => {
    return source;
  };

  const { data: source } = $resource(sourceAsync);
  $effect(() => console.log("SOURCE", source.value));
  const { data: resource } = $resource(
    asyncFunction,
    () => source?.value?.data,
    {
      initialValue: "initial",
      fetchWhen: () => source.value.data === "done"
    }
  );
  let timesComputedCalled = 0;
  $computed(() => {
    timesComputedCalled++;
    console.log("RESOURCE", resource.value);
    return resource.value.data;
  });

  await new Promise(process.nextTick);

  console.log(timesComputedCalled);
});
