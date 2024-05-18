import { $signal, $effect, $computed } from "c/signals";

export const counter = $signal(0);

$effect(() => console.log(counter.value));

export const counterPlusOne = $computed(() => counter.value + 1);
export const counterPlusTwo = $computed(() => counterPlusOne.value + 1);
