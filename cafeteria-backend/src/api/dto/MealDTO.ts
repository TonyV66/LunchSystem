import Meal from "../../models/Meal";
import { MealItem, PantryItem } from "../../models/Menu";

export default class MealDTO extends Meal {
  studentId: number;
  items: MealItem[];
}
