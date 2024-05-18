import { $store } from "../create-store";

describe("store", () => {
  test("should have a default value", () => {
    const store = $store(0);
    expect(store.value).toBe(0);
  });
});
