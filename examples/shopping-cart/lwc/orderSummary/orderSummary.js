import TwElement from "c/twElement";
import { $computed } from "c/signals";
import { shoppingCart } from "c/demoSignals";

// States
import ready from "./states/ready.html";
import loading from "./states/loading.html";
import empty from "./states/empty.html";

export default class OrderSummary extends TwElement {
  itemData = $computed(() => (this.itemData = shoppingCart.value)).value;

  render() {
    return this.itemData.loading
      ? loading
      : this.items.length > 0
        ? ready
        : empty;
  }

  get items() {
    return this.itemData.data.items;
  }

  get subtotal() {
    return this.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  }

  get tax() {
    return this.items.reduce(
      (acc, item) => acc + item.taxAmount,
      0
    );
  }

  get shipping() {
    return this.items.length > 0 ? 10 : 0;
  }

  get total() {
    return this.subtotal + this.tax + this.shipping;
  }
}
