import DailyMenuItemEntity from "../entity/DailyMenuItemEntity";

export default class DailyMenuItem {
  id: number;
  price: number;
  pantryItemId: number;

  constructor(entity: DailyMenuItemEntity) {
    this.id = entity.id;
    this.price = entity.price ?? 0;
    this.pantryItemId = entity.pantryItemId ?? 0;
  }
}
