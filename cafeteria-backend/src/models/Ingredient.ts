import IngredientEntity from "../entity/IngredientEntity";

export default class Ingredient {
  id: number;
  name: string;

  constructor(entity: IngredientEntity) {
    this.id = entity.id;
    this.name = entity.name;
  }
}
