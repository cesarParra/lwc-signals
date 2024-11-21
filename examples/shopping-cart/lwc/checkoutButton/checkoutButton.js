import TwElement from "c/twElement";
import { $computed, $effect } from "c/signals";
import { shoppingCart } from "c/demoSignals";

// States
import ready from "./states/ready.html";
import loading from "./states/loading.html";

export default class CheckoutButton extends TwElement {
  itemData = shoppingCart.value;

  connectedCallback() {
    $effect(() => {
      this.itemData = shoppingCart.value;
    });
  }

  render() {
    return this.itemData.loading ? loading : ready;
  }

  get isEmpty() {
    return this.itemData.data.items.length === 0;
  }
}
