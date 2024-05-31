import TwElement from "c/twElement";
import { $computed } from "c/signals";
import { shoppingCart, updateCart } from "c/demoSignals";

// States
import ready from "./states/ready.html";
import loading from "./states/loading.html";
import empty from "./states/empty.html";

export default class ShoppingCartDetails extends TwElement {
  itemData = $computed(() => (this.itemData = shoppingCart.value)).value;

  render() {
    return this.itemData.loading
      ? loading
      : this.items.length > 0
        ? ready
        : empty;
  }

  get quantityOptions() {
    return [
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4", value: 4 },
      { label: "5", value: 5 }
    ];
  }

  get items() {
    return (
      this.itemData.data.items?.map((item) => {
        return { ...item, total: item.price * item.quantity };
      }) ?? []
    );
  }

  removeItem(event) {
    event.preventDefault();
    const itemId = event.target.dataset.item;
    updateCart({
      items: this.items.filter((item) => item.id !== itemId)
    });
  }

  handleQuantityChange(event) {
    const itemId = event.target.dataset.item;
    const newQuantity = event.target.value;
    const newItems = this.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    updateCart({ items: newItems });
  }
}
