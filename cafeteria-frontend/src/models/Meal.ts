import { PantryItem } from "./Menu";

export interface MealItem extends PantryItem {
  price: number;
}

export default interface Meal {
  id: number;
  date: string;
  studentId: number;
  items: MealItem[];
}
