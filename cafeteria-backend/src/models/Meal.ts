import { MealItem } from "./Menu";

export default class Meal {
  id: number;
  studentId: number;
  date: string;
  items: MealItem[];
}
