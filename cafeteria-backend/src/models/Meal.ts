import MealItem from "./MealItem";
import MealEntity from "../entity/MealEntity";
import { RefundType } from "./RefundType";

export default class Meal {
  id: number;
  date: string;
  time: string;
  cancelled: boolean;
  refundType: RefundType;
  studentId: number | null;
  staffMemberId: number | null;
  items: MealItem[];

  constructor(entity: MealEntity) {
    this.id = entity.id;
    this.date = entity.date;
    this.time = entity.time;
    this.cancelled = entity.cancelled;
    this.refundType = entity.refundType;
    this.studentId = entity.student?.id ?? null;
    this.staffMemberId = entity.staffMember?.id ?? null;
    this.items = entity.items?.map(item => new MealItem(item)) ?? [];
  }
}
