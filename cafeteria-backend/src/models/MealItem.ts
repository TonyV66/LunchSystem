import MealItemEntity from "../entity/MealItemEntity";

export default class MealItem {
  id: number;
  price: number;
  pantryItemId: number;

  constructor(entity: MealItemEntity) {
    this.id = entity.id;
    this.price = entity.price;
    this.pantryItemId = entity.pantryItemId ?? 0;
  }
}
