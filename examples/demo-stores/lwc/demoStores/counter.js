import { $store, $effect, $computed } from "c/store";

export const counter = $store(0);

$effect(() => console.log(counter.value));

export const counterPlusOne = $computed(() => counter.value + 1);
export const counterPlusTwo = $computed(() => counterPlusOne.value + 1);
