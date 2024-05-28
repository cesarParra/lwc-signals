import { $signal, $effect, $computed, useCookies } from "c/signals";

let tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

export const counter = $signal(0, {
  storage: useCookies("counter", tomorrow)
});

$effect(() => console.log(counter.value));

export const counterPlusOne = $computed(() => counter.value + 1);
export const counterPlusTwo = $computed(() => counterPlusOne.value + 1);
