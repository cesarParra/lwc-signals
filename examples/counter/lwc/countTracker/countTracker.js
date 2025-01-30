import { LightningElement } from "lwc";
import { $binded, $computed } from "c/signals";
import { counter, counterPlusTwo } from "c/demoSignals";

export default class CountTracker extends LightningElement {
  bindTest = $binded(this, "bindTest").to(counter);

  reactiveProperty = $computed(() => (this.reactiveProperty = counter.value))
    .value;

  counterPlusTwo = $computed(() => (this.counterPlusTwo = counterPlusTwo.value))
    .value;
}
