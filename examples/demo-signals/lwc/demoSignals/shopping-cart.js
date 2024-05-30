import { $resource } from "c/signals";
import getShoppingCart from "@salesforce/apex/ShoppingCartController.getShoppingCart";
import updateShoppingCart from "@salesforce/apex/ShoppingCartController.updateShoppingCart";

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

/**
 * Updates the cart on the server
 * @param {Item[]} newCart
 * @param _
 * @param mutate
 */
async function updateCartOnTheServer(newCart, _, mutate) {
  // Quantities can be updated, so gather the Ids and quantities and check
  // if the quantities have changed. Note that only one item can be updated
  // at a time in this example.
  try {
    const updatedShoppingCart = await updateShoppingCart({
      newItems: newCart.items
    });
    mutate(updatedShoppingCart);
  } catch (error) {
    mutate(null, error);
  }
}

// TODO: When we document this, remember there are 2 options. We can either
// do the update the same way we are doing it here (through onMutate) or
// it can be done in the component and then `refetch` can be called.

export const { data: shoppingCart, mutate: updateCart } = $resource(
  getShoppingCart,
  {},
  {
    onMutate: updateCartOnTheServer
  }
);
