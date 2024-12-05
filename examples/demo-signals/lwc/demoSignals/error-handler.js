import { $signal, $computed, $effect } from "c/signals";

const anySignal = $signal(0);

$computed(() => {
  anySignal.value;
  throw new Error("An error occurred during a computation");
});

$effect(() => {
  throw new Error("An error occurred during an effect");
});
