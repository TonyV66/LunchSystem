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
}

export class PantryItem {
  id: number;
  name: string;
  type: PantryItemType;
}

export class MealItem extends PantryItem {
  price: number;
}

export class DailyMenu extends Menu {
  date: string;
  orderStartTime: Date;
  orderEndTime: Date;
}