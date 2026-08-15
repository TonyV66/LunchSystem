import MenuEntity from "../entity/MenuEntity";
import MenuItemEntity from "../entity/MenuItemEntity";
import MenuItem from "./MenuItem";

export default class Menu {
  id: number;
  name: string;
  showDessertAsSide: boolean;
  numSidesWithMeal: number;
  price: number;
  drinkOnlyPrice: number;
  items: MenuItem[];

  constructor(entity: MenuEntity) {
    this.id = entity.id;
    this.name = entity.name;
    this.showDessertAsSide = entity.showDessertAsSide;
    this.numSidesWithMeal = entity.numSidesWithMeal;
    this.price = entity.price;
    this.drinkOnlyPrice = entity.drinkOnlyPrice;
    this.items =
      entity.items?.map((item: MenuItemEntity) => new MenuItem(item)) ?? [];
  }
}
