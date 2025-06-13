import MenuEntity, { PantryItemEntity, MealItemEntity, DailyMenuEntity, MenuItemEntity, DailyMenuItemEntity } from "../entity/MenuEntity";

export enum PantryItemType {
  ENTREE,
  SIDE,
  DESSERT,
  DRINK
}

export class Menu {
  id: number;
  name: string;
  showDessertAsSide: boolean;
  numSidesWithMeal: number;
  price: number;
  drinkOnlyPrice: number;
  items: PantryItem[];

  constructor(entity: MenuEntity) {
    this.id = entity.id;
    this.name = entity.name;
    this.showDessertAsSide = entity.showDessertAsSide;
    this.numSidesWithMeal = entity.numSidesWithMeal;
    this.price = entity.price;
    this.drinkOnlyPrice = entity.drinkOnlyPrice;
    this.items = entity.items?.map((item: MenuItemEntity) => new PantryItem({
      id: item.id,
      name: item.name,
      type: item.type,
      school: null as any // Required by PantryItemEntity but not used in model
    })) ?? [];
  }
}

export class PantryItem {
  id: number;
  name: string;
  type: PantryItemType;

  constructor(entity: PantryItemEntity) {
    this.id = entity.id;
    this.name = entity.name;
    this.type = entity.type;
  }
}

export class MealItem extends PantryItem {
  price: number;

  constructor(entity: MealItemEntity) {
    // Create a base PantryItem from the MealItemEntity properties
    super({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      school: null as any // Required by PantryItemEntity but not used in model
    });
    this.price = entity.price;
  }
}

export class DailyMenu extends Menu {
  date: string;
  orderStartTime: Date;
  orderEndTime: Date;

  constructor(entity: DailyMenuEntity) {
    // Create a base Menu from the DailyMenuEntity properties
    super({
      id: entity.id,
      name: entity.name,
      showDessertAsSide: entity.showDessertAsSide,
      numSidesWithMeal: entity.numSidesWithMeal,
      price: entity.price,
      drinkOnlyPrice: entity.drinkOnlyPrice,
      items: entity.items?.map((item: DailyMenuItemEntity) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        menu: null as any // Required by MenuItemEntity but not used in model
      })) ?? [],
      school: null as any // Required by MenuEntity but not used in model
    });
    this.date = entity.date;
    this.orderStartTime = entity.orderStartTime;
    this.orderEndTime = entity.orderEndTime;
  }
}