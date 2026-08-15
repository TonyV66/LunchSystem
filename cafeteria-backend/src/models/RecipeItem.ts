import RecipeItemEntity from "../entity/RecipeItemEntity";

export default class RecipeItem {
  id: number;
  qty: number;
  unitOfMeasure: string | null;
  description: string;

  constructor(entity: RecipeItemEntity) {
    this.id = entity.id;
    this.qty = entity.qty ?? 1;
    this.unitOfMeasure = entity.unitOfMeasure ?? null;
    this.description = entity.description;
  }
}
