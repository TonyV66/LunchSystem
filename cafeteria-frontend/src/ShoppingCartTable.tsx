import React, { useContext, useEffect, useState } from "react";
import "./App.css";
import { AppContext } from "./AppContextProvider";
import { DateTimeUtils } from "./DateTimeUtils";
import { DailyMenu, PantryItemType } from "./models/Menu";
import OrderedMealsTable from "./OrderedMealsTable";
import Meal from "./models/Meal";
import { ShoppingCart } from "./models/ShoppingCart";
import { Order } from "./models/Order";
import User from "./models/User";

const buildOrder = (
  shoppingCart: ShoppingCart,
  dailyMenus: DailyMenu[],
  user: User
): Order => {
  return {
    id: 0,
    date: DateTimeUtils.toString(new Date()),
    taxes: 0,
    processingFee: 0,
    otherFees: 0,
    userId: user.id,
    meals: shoppingCart.items.map((shoppingCartItem, index) => {
      const dailyMenu = dailyMenus.find(
        (sm) => sm.id === shoppingCartItem.dailyMenuId
      )!;

      let entrees = dailyMenu.items.filter(
        (item) => item.type === PantryItemType.ENTREE
      );
      let sides = dailyMenu.items.filter(
        (item) => item.type === PantryItemType.SIDE
      );
      let desserts = dailyMenu.items.filter(
        (item) => item.type === PantryItemType.DESSERT
      );
      let drinks = dailyMenu.items.filter(
        (item) => item.type === PantryItemType.DRINK
      );

      if (!shoppingCartItem.isDrinkOnly) {
        if (entrees.length > 1) {
          entrees = entrees.filter((entree) =>
            shoppingCartItem.selectedMenuItemIds.includes(entree.id)
          );
        }
        if (
          sides.length > 1 &&
          dailyMenu.numSidesWithMeal &&
          dailyMenu.numSidesWithMeal < sides.length
        ) {
          sides = sides.filter((side) =>
            shoppingCartItem.selectedMenuItemIds.includes(side.id)
          );
        }
        if (desserts.length > 1) {
          desserts = desserts.filter((dessert) =>
            shoppingCartItem.selectedMenuItemIds.includes(dessert.id)
          );
        }
      }
      if (drinks.length > 1) {
        drinks = drinks.filter((drink) =>
          shoppingCartItem.selectedMenuItemIds.includes(drink.id)
        );
      }

      return {
        id: index,
        date: dailyMenu.date,
        studentId: shoppingCartItem.studentId,
        items: entrees
          .concat(sides)
          .concat(desserts)
          .concat(drinks)
          .map((pantryItem) => {
            let price = 0;
            if (
              shoppingCartItem.isDrinkOnly &&
              pantryItem.type === PantryItemType.DRINK
            ) {
              price = dailyMenu.drinkOnlyPrice;
            } else if (
              !shoppingCartItem.isDrinkOnly &&
              pantryItem.type === PantryItemType.ENTREE
            ) {
              price = dailyMenu.price;
            }
            return {
              ...pantryItem,
              price,
            };
          }),
      };
    }),
  };
};

interface ShoppingCartTableProps {
  date?: string;
  hidePrice?: boolean;
  hideDate?: boolean;
  hideTitlebar?: boolean;
  editable: boolean;
}

const ShoppingCartTable: React.FC<ShoppingCartTableProps> = ({
  date,
  hidePrice,
  hideDate,
  editable,
  hideTitlebar,
}) => {
  const { user, shoppingCart, scheduledMenus, setShoppingCart } =
    useContext(AppContext);
  const [order, setOrder] = useState(buildOrder(shoppingCart, scheduledMenus, user));

  const handleDeleteMeal = (meal: Meal) => {
    const updatedShoppingCartItems = [...shoppingCart.items];
    updatedShoppingCartItems.splice(meal.id, 1);
    const updatedCart = {
      ...shoppingCart,
      items: updatedShoppingCartItems,
    };
    setShoppingCart(updatedCart);
  };

  useEffect(
    () => setOrder(buildOrder(shoppingCart, scheduledMenus, user)),
    [shoppingCart, scheduledMenus]
  );

  return (
    <OrderedMealsTable
      orders={[order]}
      startDate={date}
      endDate={date}
      hideDate={hideDate}
      hidePrice={hidePrice}
      onDelete={editable ? handleDeleteMeal : undefined}
      hideTitlebar={hideTitlebar}
    ></OrderedMealsTable>
  );
};

export default ShoppingCartTable;
