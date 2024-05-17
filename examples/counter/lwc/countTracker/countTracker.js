import { LightningElement } from "lwc";
import { $computed } from "c/store";
import { counter } from "c/counter";

export default class CountTracker extends LightningElement {
  currentCount = counter.value;

  connectedCallback() {
    $computed(() => (this.currentCount = counter.value));
  }
}
