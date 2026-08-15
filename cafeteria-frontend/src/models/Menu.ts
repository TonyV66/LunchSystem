import MenuItem from "./MenuItem";

export default interface Menu {
  id: number;
  name: string;
  showDessertAsSide: boolean;
  numSidesWithMeal: number;
  price: number;
  drinkOnlyPrice: number;
  items: MenuItem[];
}
