import { deepEqual } from "../utils";

describe("deepEqual", () => {
  test("correctly compares against undefined", () => {
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(undefined, null)).toBe(false);
    expect(deepEqual(undefined, 1)).toBe(false);
    expect(deepEqual(undefined, "foo")).toBe(false);
    expect(deepEqual(undefined, {})).toBe(false);
    expect(deepEqual(undefined, [])).toBe(false);
  });

  test("correct compares against nulls", () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, 1)).toBe(false);
    expect(deepEqual(null, "foo")).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual(null, [])).toBe(false);
  });

  test("compares simple values", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual("foo", "foo")).toBe(true);
    expect(deepEqual("foo", "bar")).toBe(false);
  });

  test("compares objects", () => {
    expect(deepEqual({}, {})).toBe(true);
    expect(deepEqual({ foo: "bar" }, { foo: "bar" })).toBe(true);
    expect(deepEqual({ foo: "bar" }, { foo: "baz" })).toBe(false);
    expect(deepEqual({ foo: "bar" }, { bar: "baz" })).toBe(false);
    expect(deepEqual({ foo: "bar" }, { foo: "bar", bar: "baz" })).toBe(false);
  });

  test("deep compares objects", () => {
    expect(deepEqual({ foo: { bar: "baz" } }, { foo: { bar: "baz" } })).toBe(true);
    expect(deepEqual({ foo: { bar: "baz" } }, { foo: { bar: "qux" } })).toBe(false);
    expect(deepEqual({ foo: { bar: "baz" } }, { foo: { baz: "qux" } })).toBe(false);
    expect(deepEqual({ foo: { bar: "baz" } }, { foo: { bar: "baz", baz: "qux" } })).toBe(false);
  });

  test("compares arrays", () => {
    expect(deepEqual([], [])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
    expect(deepEqual([1, 2, 3], [1, 2, 3, 4])).toBe(false);
  });
});
