import { LightningElement } from "lwc";
import { $computed, counter } from "c/signals";

export default class CountTracker extends LightningElement {
  reactiveProperty = $computed(() => (this.reactiveProperty = counter.value))
    .value;
}
