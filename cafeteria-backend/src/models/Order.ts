import Meal from "./Meal";
import { OrderEntity } from "../entity/OrderEntity";

export class Order {
  id: number;
  userId: number;
  date: string;
  taxes: number;
  processingFee: number;
  otherFees: number;
  meals: Meal[];

  constructor(entity: OrderEntity) {
    this.id = entity.id;
    this.userId = entity.user?.id ?? 0;
    this.date = entity.date;
    this.taxes = entity.taxes;
    this.processingFee = entity.processingFee;
    this.otherFees = entity.otherFees;
    this.meals = entity.meals?.map(meal => new Meal(meal)) ?? [];
  }
}