import DailyMenuEntity from "../entity/DailyMenuEntity";
import DailyMenuItem from "./DailyMenuItem";

export default class DailyMenu {
  id: number;
  name: string;
  showDessertAsSide: boolean;
  numSidesWithMeal: number;
  price: number;
  drinkOnlyPrice: number;
  items: DailyMenuItem[];
  date: string;
  orderStartTime: Date;
  orderEndTime: Date;

  constructor(entity: DailyMenuEntity) {
    this.id = entity.id;
    this.name = entity.name;
    this.showDessertAsSide = entity.showDessertAsSide;
    this.numSidesWithMeal = entity.numSidesWithMeal;
    this.price = entity.price;
    this.drinkOnlyPrice = entity.drinkOnlyPrice;
    this.items =
      entity.items?.map((item) => new DailyMenuItem(item)) ?? [];
    this.date = entity.date;
    this.orderStartTime = entity.orderStartTime;
    this.orderEndTime = entity.orderEndTime;
  }
}
