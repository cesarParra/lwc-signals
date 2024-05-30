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
 * @param {Item[]} oldCart
 */
async function updateCartOnTheServer(newCart, _, mutate) {
  // Quantities can be updated, so gather the Ids and quantities and check
  // if the quantities have changed. Note that only one item can be updated
  // at a time in this example.
  console.log("Updated items", JSON.stringify(newCart, null, 2));
  try {
    const updatedShoppingCart = await updateShoppingCart({
      newItems: newCart.items
    });
    mutate(updatedShoppingCart);
  } catch (error) {
    console.error("Error updating shopping cart", error);
  }
}

export const { data: shoppingCart, mutate: updateCart } = $resource(
  getShoppingCart,
  {},
  {
    onMutate: updateCartOnTheServer
  }
);
