import { $store, $effect } from "c/store";

export const counter = $store(0);

$effect(() => console.log(counter.value));
