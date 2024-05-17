import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { counter } from "c/demoStores";

export default class CountTracker extends LightningElement {
  currentCount = $computed(() => (this.currentCount = counter.value));
}
