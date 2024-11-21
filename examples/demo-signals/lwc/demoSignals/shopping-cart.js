import { $signal, $resource, $effect, useLocalStorage } from "c/signals";
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
export const cartHistory = $signal([], {track: true});
$effect(() => {
  console.log('cartHistory', JSON.stringify(cartHistory.value, null, 2));
});
let isUndoing = false;

export const undoCartChange = () => {
  isUndoing = true;
  const lastState = cartHistory.value[cartHistory.value.length - 1];
  // Remove the last state from the history
  cartHistory.value.splice(-1, 1);
  if (lastState) {
    updateCart(lastState);
  }
  isUndoing = false;
};

/**
 * Updates the cart on the server
 * @param {ShoppingCart} newCart
 * @param {ShoppingCart} previousValue
 * @param mutate
 */
async function updateCartOnTheServer(newCart, previousValue, mutate) {
  try {
    // Keep track of the isUndoing value before making any async changes
    // to ensure we don't update the history when undoing, even after
    // an async operation.
    const shouldUpdateHistory = !isUndoing;
    // Update the cart on the server
    const updatedShoppingCart = await updateShoppingCart({
      newItems: newCart.items
    });

    // Update the local state with the new cart received from the server
    mutate(updatedShoppingCart);

    // Store the previous value in the history
    if (shouldUpdateHistory) {
      cartHistory.value.push(previousValue);
    }
  } catch (error) {
    mutate(null, error);
  }
}

const cachedCart = $signal(null, {
  storage: useLocalStorage("shoppingCart")
});

export const { data: shoppingCart, mutate: updateCart } = $resource(
  getShoppingCart,
  {},
  {
    initialValue: cachedCart.value,
    onMutate: updateCartOnTheServer
  }
);

$effect(() => {
  cachedCart.value = shoppingCart.value;
});
