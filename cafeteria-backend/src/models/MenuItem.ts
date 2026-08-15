import MenuItemEntity from "../entity/MenuItemEntity";

export default class MenuItem {
  id: number;
  price: number;
  pantryItemId: number;

  constructor(entity: MenuItemEntity) {
    this.id = entity.id;
    this.price = entity.price ?? 0;
    this.pantryItemId = entity.pantryItemId ?? 0;
  }
}
