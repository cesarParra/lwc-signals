import { $resource } from "c/signals";
import getShoppingCart from "@salesforce/apex/ShoppingCartController.getShoppingCart";

export const { data: shoppingCart, mutate: updateCart } = $resource(
  getShoppingCart,
  {}
);
