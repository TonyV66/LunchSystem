export interface ShoppingCartMealTime {
  date: string;
  time: string;
}

export interface ShoppingCart {
  mealTimes?: ShoppingCartMealTime[];
  items: ShoppingCartItem[]
}

export interface ShoppingCartItem {
  studentId?: number;
  dailyMenuId: number;
  isDrinkOnly: boolean;
  selectedMenuItemIds: number[];
}