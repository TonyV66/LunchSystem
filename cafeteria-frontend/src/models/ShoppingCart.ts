export interface ShoppingCartMealTime {
  date: string;
  time: string;
}

export interface ShoppingCart {
  mealTimes?: ShoppingCartMealTime[];
  items: ShoppingCartItem[]
}

export interface ShoppingCartItem {
  time?: string;
  studentId?: number;
  staffMemberId?: number;
  dailyMenuId: number;
  isDrinkOnly: boolean;
  selectedMenuItemIds: number[];
}