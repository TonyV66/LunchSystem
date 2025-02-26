export interface ShoppingCart {
  items: ShoppingCartItem[]
}

export interface ShoppingCartItem {
  studentId: number;
  teacherId: number;
  dailyMenuId: number;
  isDrinkOnly: boolean;
  selectedMenuItemIds: number[];
}