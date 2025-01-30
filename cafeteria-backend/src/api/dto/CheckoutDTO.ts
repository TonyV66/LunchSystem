import { ShoppingCart } from "../../models/ShoppingCart";

export class CheckoutDTO {
  paymentToken: string;
  shoppingCart: ShoppingCart;
}