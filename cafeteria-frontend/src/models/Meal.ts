import MealItem from "./MealItem";
import { RefundType } from "./RefundType";

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
