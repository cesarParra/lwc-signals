import TwElement from "c/twElement";
import {$computed} from 'c/signals';
import {shoppingCart} from "c/demoSignals";

// States
import ready from "./states/ready.html";
import loading from "./states/loading.html";

export default class CheckoutButton extends TwElement {
  itemData = $computed(() => this.itemData = shoppingCart.value).value;

  render() {
    return this.itemData.loading ? loading : ready;
  }

  get isEmpty() {
    return this.itemData.data.items.length === 0;
  }
}
