import { MealItem } from "./Menu";
import MealEntity from "../entity/MealEntity";

export default class Meal {
  id: number;
  date: string;
  time: string;
  studentId: number | null;
  staffMemberId: number | null;
  items: MealItem[];

  constructor(entity: MealEntity) {
    this.id = entity.id;
    this.date = entity.date;
    this.time = entity.time;
    this.studentId = entity.student?.id ?? null;
    this.staffMemberId = entity.staffMember?.id ?? null;
    this.items = entity.items?.map(item => new MealItem(item)) ?? [];
  }
}
