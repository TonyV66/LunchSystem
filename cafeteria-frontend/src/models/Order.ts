import Meal from "./Meal";

export interface Order {
  id: number;
  userId: number;
  date: string;
  meals: Meal[];
  taxes: number;
  processingFee: number;
  otherFees: number;
}