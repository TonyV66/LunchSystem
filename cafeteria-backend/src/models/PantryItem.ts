import PantryItemEntity from "../entity/PantryItemEntity";
import { PantryItemType } from "./PantryItemType";
import RecipeItem from "./RecipeItem";

export default class PantryItem {
  id: number;
  name: string;
  type: PantryItemType;
  recipeServingSize: number;
  price: number;
  archived: boolean;
  recipeItems: RecipeItem[];

  constructor(entity: PantryItemEntity) {
    this.id = entity.id;
    this.name = entity.name;
    this.type = entity.type;
    this.recipeServingSize = entity.recipeServingSize ?? 1;
    this.price = entity.price ?? 0;
    this.archived = entity.archived ?? false;
    this.recipeItems =
      entity.recipeItems?.map((item) => new RecipeItem(item)) ?? [];
  }
}
