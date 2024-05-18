import { LightningElement } from "lwc";
import { $computed, $reactTo } from "c/store";
import { counter } from "c/demoStores";

export default class CountTracker extends LightningElement {
  get currentCount() {
    return $reactTo(counter);
  }

  reactiveProperty = $computed(() => (this.reactiveProperty = counter.value));

  get counterMultiplied() {
    return $computed(() => counter.value * 2);
  }
}
