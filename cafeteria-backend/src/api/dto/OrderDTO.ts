import { Order } from "../../models/Order";
import MealDTO from "./MealDTO";

export class OrderDTO extends Order {
  meals: MealDTO[];
  userId: number;
}