import { ShoppingCart } from "./ShoppingCart";

export interface Checkout {
  paymentToken: string;
  shoppingCart: ShoppingCart;
}