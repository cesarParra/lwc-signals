import { $resource } from "c/signals";
import getShoppingCart from "@salesforce/apex/ShoppingCartController.getShoppingCart";
import updateShoppingCart from "@salesforce/apex/ShoppingCartController.updateShoppingCart";

/**
 * @typedef {Object} ShoppingCart
 * @property {Item[]} items
 */

/**
 * @typedef {Object} Item
 * @property {string} id
 * @property {string} name
 * @property {string[]} properties
 * @property {number} quantity
 * @property {number} price
 * @property {number} taxAmount
 * @property {number} imgUrl
 */

// Store each state change in the cart history
const cartHistory = [];
let isUndoing = false;

export function undoCartChange() {
  isUndoing = true;
  const lastState = cartHistory.pop();
  if (lastState) {
    updateCart(lastState);
  }
  isUndoing = false;
}

/**
 * Updates the cart on the server
 * @param {ShoppingCart} newCart
 * @param {ShoppingCart} previousValue
 * @param mutate
 */
async function updateCartOnTheServer(newCart, previousValue, mutate) {
  try {
    // Update the cart on the server
    const updatedShoppingCart = await updateShoppingCart({
      newItems: newCart.items
    });

    // Update the local state with the new cart received from the server
    mutate(updatedShoppingCart);

    // Store the previous value in the history
    if (!isUndoing) {
      cartHistory.push(previousValue);
    }
  } catch (error) {
    mutate(null, error);
  }
}

// TODO: When we document this, remember there are 2 options. We can either
// do the update the same way we are doing it here (through onMutate) or
// it can be done in the component (or anywhere really) and then `refetch` can be called.

export const { data: shoppingCart, mutate: updateCart } = $resource(
  getShoppingCart,
  {},
  {
    onMutate: updateCartOnTheServer
  }
);
