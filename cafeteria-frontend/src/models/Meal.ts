import { PantryItem } from "./Menu";
import { RefundType } from "./RefundType";

export interface MealItem extends PantryItem {
  price: number;
}

export default interface Meal {
  id: number;
  date: string;
  time: string;
  cancelled: boolean;
  refundType: RefundType;
  studentId?: number | null;
  staffMemberId?: number | null;
  items: MealItem[];
}
