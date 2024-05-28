import { LightningElement } from "lwc";
import { counter } from "c/signals";

export default class CountChanger extends LightningElement {
  incrementCount() {
    counter.value++;
  }

  decrementCount() {
    counter.value--;
  }
}
