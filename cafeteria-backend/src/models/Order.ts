import Meal from "./Meal";

export class Order {
  id: number;
  userId: number;
  date: string;
  taxes: number;
  processingFee: number;
  otherFees: number;
  meals: Meal[];
}