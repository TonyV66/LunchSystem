import DailyMenuItem from "./DailyMenuItem";

export default interface DailyMenu {
  id: number;
  name: string;
  showDessertAsSide: boolean;
  numSidesWithMeal: number;
  price: number;
  drinkOnlyPrice: number;
  items: DailyMenuItem[];
  date: string;
  orderStartTime: string;
  orderEndTime: string;
}
