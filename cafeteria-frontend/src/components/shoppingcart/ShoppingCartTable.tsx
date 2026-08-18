import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../AppContextProvider";
import { DateTimeUtils } from "../../DateTimeUtils";
import DailyMenu from "../../models/DailyMenu";
import { PantryItemType } from "../../models/PantryItemType";
import OrderedMealsTable from "../meals/OrderedMealsTable";
import Meal from "../../models/Meal";
import { ShoppingCart } from "../../models/ShoppingCart";
import { Order } from "../../models/Order";
import User from "../../models/User";
import { RefundType } from "../../models/RefundType";
import PantryItem from "../../models/PantryItem";
import DailyMenuItem from "../../models/DailyMenuItem";

const buildOrder = (
  pantryItems: PantryItem[],
  shoppingCart: ShoppingCart,
  dailyMenus: DailyMenu[],
  user: User
): Order => {
  return {
    id: 0,
    date: DateTimeUtils.toString(DateTimeUtils.getCurrentDate()),
    taxes: 0,
    processingFee: 0,
    otherFees: 0,
    appliedCredits: 0,
    userId: user.id,
    meals: shoppingCart.items.map((shoppingCartItem, index) => {
      const dailyMenu = dailyMenus.find(
        (sm) => sm.id === shoppingCartItem.dailyMenuId
      )!;

      let entrees: DailyMenuItem[] = [];
      let sides: DailyMenuItem[] = [];
      let desserts: DailyMenuItem[] = [];

      if (!shoppingCartItem.isDrinkOnly) {
        entrees = dailyMenu.items.filter(
          (item) => pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)?.type === PantryItemType.ENTREE
        )
        if (entrees.length > 1) {
          entrees = entrees.filter((entree) =>
            shoppingCartItem.selectedMenuItemIds.includes(entree.id)
          );
        }

        sides = dailyMenu.items.filter(
          (item) => pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)?.type === PantryItemType.SIDE
        );
        if (
          sides.length > 1 &&
          dailyMenu.numSidesWithMeal &&
          dailyMenu.numSidesWithMeal < sides.length
        ) {
          sides = sides.filter((side) =>
            shoppingCartItem.selectedMenuItemIds.includes(side.id)
          );
        }

        desserts = dailyMenu.items.filter(
          (item) => pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)?.type === PantryItemType.DESSERT
        );
        if (desserts.length > 1) {
          desserts = desserts.filter((dessert) =>
            shoppingCartItem.selectedMenuItemIds.includes(dessert.id)
          );
        }
      }


      let drinks = dailyMenu.items.filter(
        (item) => pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)?.type === PantryItemType.DRINK
      );
      if (drinks.length > 1) {
        drinks = drinks.filter((drink) =>
          shoppingCartItem.selectedMenuItemIds.includes(drink.id)
        );
      }

      return {
        id: index,
        date: dailyMenu.date,
        time: "",
        cancelled: false,
        refundType: RefundType.NONE,
        staffMemberId: shoppingCartItem.studentId
          ? undefined
          : shoppingCartItem.staffMemberId ?? user.id,
        studentId: shoppingCartItem.studentId,
        items: entrees
          .concat(sides)
          .concat(desserts)
          .concat(drinks)
          .map((menuItem) => {
            const pantryItem = pantryItems.find(
              (item) => item.id === menuItem.pantryItemId
            )!;
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
              id: menuItem.id,
              pantryItemId: menuItem.pantryItemId,
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
  const { user, shoppingCart, scheduledMenus, setShoppingCart, pantryItems } =
    useContext(AppContext);
  const [order, setOrder] = useState(buildOrder(pantryItems, shoppingCart, scheduledMenus, user));

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
    () => setOrder(buildOrder(pantryItems, shoppingCart, scheduledMenus, user)),
    [shoppingCart, scheduledMenus]
  );

  return (
    <OrderedMealsTable
      order={order}
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
