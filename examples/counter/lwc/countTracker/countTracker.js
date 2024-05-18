import { LightningElement } from "lwc";
import { $effect, $computed, $rxProp, $rxProp2 } from "c/store";
import { counter } from "c/demoStores";

export default class CountTracker extends LightningElement {
  currentCount = counter.value;

  connectedCallback() {
    $effect(() => (this.currentCount = counter.value));
  }

  another = $rxProp(counter, () => (this.another = counter.value));

  get asGetter() {
    return $computed(() => counter.value);
  }

  get autoSubProp() {
    return $rxProp2(counter);
  }
}
