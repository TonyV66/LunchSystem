import { PantryItemType } from "./PantryItemType";
import RecipeItem from "./RecipeItem";

export default interface PantryItem {
  id: number;
  name: string;
  type: PantryItemType;
  recipeServingSize: number;
  price: number;
  archived: boolean;
  recipeItems: RecipeItem[];
}
