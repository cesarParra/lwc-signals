import { LightningElement } from "lwc";
import { counter } from "c/demoSignals";

export default class CountChanger extends LightningElement {
  incrementCount() {
    counter.value++;
  }

  decrementCount() {
    counter.value--;
  }
}
