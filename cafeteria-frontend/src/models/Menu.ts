export enum PantryItemType {
  ENTREE,
  SIDE,
  DESSERT,
  DRINK
}

export interface PantryItem {
  id: number;
  name: string;
  type: PantryItemType;
}

export interface DailyMenu extends Menu {
  date: string;
  orderStartTime: string;
  orderEndTime: string;

}

export default interface Menu {
  id: number;
  name: string;
  showDessertAsSide: boolean;
  numSidesWithMeal: number;
  price: number;
  drinkOnlyPrice: number;
  items: PantryItem[];
}
