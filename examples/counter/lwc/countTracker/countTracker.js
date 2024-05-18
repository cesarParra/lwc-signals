import { LightningElement } from "lwc";
import { $computed, $reactTo } from "c/store";
import { counter, counterPlusTwo } from "c/demoStores";

export default class CountTracker extends LightningElement {
  get currentCount() {
    return $reactTo(counter);
  }

  reactiveProperty = $computed(() => (this.reactiveProperty = counter.value))
    .value;

  get counterMultiplied() {
    return $computed(() => counter.value * 2).value;
  }

  counterPlusTwo = $computed(() => (this.counterPlusTwo = counterPlusTwo.value))
    .value;
}
