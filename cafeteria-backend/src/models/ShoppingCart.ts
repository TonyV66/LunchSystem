export interface ShoppingCartMealTime {
  date: string;
  time: string;
}

export interface ShoppingCart {
  items: ShoppingCartItem[];
}

export interface ShoppingCartItem {
  studentId?: number;
  dailyMenuId: number;
  isDrinkOnly: boolean;
  selectedMenuItemIds: number[];
}