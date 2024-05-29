import { LightningElement } from "lwc";
import { $computed } from "c/signals";
import { counter, counterPlusTwo } from "c/demoSignals";

export default class CountTracker extends LightningElement {
  reactiveProperty = $computed(() => (this.reactiveProperty = counter.value))
    .value;

  counterPlusTwo = $computed(() => (this.counterPlusTwo = counterPlusTwo.value))
    .value;
}