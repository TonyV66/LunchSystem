import * as React from "react";
import { Typography } from "@mui/material";
import { DateTimeFormat, DateTimeUtils, DaysOfWeek } from "../../DateTimeUtils";
import PantryItem from "../../models/PantryItem";
import { AppContext } from "../../AppContextProvider";
import DailyMenu from "../../models/DailyMenu";
import { Order } from "../../models/Order";

interface DailyShoppingListProps {
  startDate: string;
  endDate: string;
}

interface ShoppingListRowProps {
  description: string;
  qty: number;
  measure: string;
}

const ShoppingListRow: React.FC<ShoppingListRowProps> = ({
  description,
  qty,
  measure,
}) => {
  return (
    <tr>
      <td
        style={{
          border: "1px solid #333",
          padding: "4px",
          textAlign: "left",
        }}
      >
        <Typography variant="caption">{description}</Typography>
      </td>

      <td
        style={{
          border: "1px solid #333",
          padding: "4px",
          textAlign: "left",
          width: 75,
        }}
      >
        <Typography variant="caption">{qty}</Typography>
      </td>
      <td
        style={{
          border: "1px solid #333",
          padding: "4px",
          textAlign: "left",
          width: 75,
        }}
      >
        <Typography variant="caption">{measure}</Typography>
      </td>
    </tr>
  );
};

const getPantryItems = (
  allPantryItems: PantryItem[],
  orders: Order[],
  scheduledMenus: DailyMenu[],
  date: string,
): PantryItem[] => {
  const scheduledMenu = scheduledMenus.find((menu) => menu.date === date);
  const pantryItemIds = orders
    .flatMap((order) => order.meals)
    .filter((meal) => !meal.cancelled && meal.date === date)
    .flatMap((meal) => meal.items)
    .map((mealItem) => mealItem.pantryItemId);
  pantryItemIds.push(
    ...(scheduledMenu?.items.map((item) => item.pantryItemId) ?? []),
  );

  return allPantryItems.filter((pantryItem) =>
    pantryItemIds.includes(pantryItem.id),
  );
};

const ceilQty = (value: number) => Math.ceil(value * 10) / 10;

const SummaryShoppingList: React.FC<DailyShoppingListProps> = ({
  startDate,
  endDate,
}) => {
  const {
    orders,
    scheduledMenus,
    pantryItems: allPantryItems,
  } = React.useContext(AppContext);

  let currentDate = startDate;
  const dates: string[] = [];
  while (currentDate <= endDate) {
    if (!DateTimeUtils.dateFallsOnDayOfWeek(currentDate, DaysOfWeek.WEEKENDS)) {
      dates.push(currentDate);
    }
    currentDate = DateTimeUtils.toString(DateTimeUtils.addDays(currentDate, 1));
  }

  let totalItems: { item: PantryItem; quantity: number }[] = [];

  dates.forEach((date) => {
    const pantryItems = getPantryItems(
      allPantryItems,
      orders,
      scheduledMenus,
      date,
    );

    const itemsWithQuantities = pantryItems.map((pantryItem) => ({
      item: pantryItem,
      quantity: orders
        .flatMap((order) => order.meals)
        .filter((meal) => !meal.cancelled && meal.date === date)
        .flatMap((meal) => meal.items)
        .filter((mealItem) => pantryItem.id === mealItem.pantryItemId).length,
    }));

    totalItems = totalItems.concat(itemsWithQuantities);
  });

  const consolidatedItems = totalItems.reduce(
    (acc, { item, quantity }) => {
      const existingItem = acc.find((existing) => existing.item.id === item.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        acc.push({ item, quantity });
      }

      return acc;
    },
    [] as { item: PantryItem; quantity: number }[],
  );

  const sortedConsolidatedItems = consolidatedItems.sort(
    (a, b) =>
      a.item.type - b.item.type ||
      a.item.name.toLowerCase().localeCompare(b.item.name.toLowerCase()),
  );

  const pantryOnlyRows = sortedConsolidatedItems
    .filter(({ item }) => !item.recipeItems?.length)
    .map(({ item, quantity }) => ({
      key: String(item.id),
      description: item.name,
      qty: ceilQty(quantity),
      measure: "each",
    }));

  const consolidatedRecipeRows = Array.from(
    sortedConsolidatedItems
      .filter(({ item }) => item.recipeItems?.length)
      .reduce(
        (acc, { item, quantity }) => {
          const servingSize = item.recipeServingSize || 1;

          item.recipeItems.forEach((recipeItem) => {
            const description = recipeItem.description;
            const measure = recipeItem.unitOfMeasure ?? "";
            const key = `${description.toLowerCase()}|${measure.toLowerCase()}`;
            const qty = ceilQty((quantity * recipeItem.qty) / servingSize);
            const existing = acc.get(key);

            if (existing) {
              existing.qty += qty;
            } else {
              acc.set(key, { key, description, measure, qty });
            }
          });

          return acc;
        },
        new Map<
          string,
          {
            key: string;
            description: string;
            measure: string;
            qty: number;
          }
        >(),
      )
      .values(),
  )
    .map((row) => ({ ...row, qty: ceilQty(row.qty) }))
    .sort((a, b) =>
      a.description.toLowerCase().localeCompare(b.description.toLowerCase()),
    );

  const shoppingListRows = [...pantryOnlyRows, ...consolidatedRecipeRows];

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "10px",
        border: "1px solid #000",
      }}
    >
      <thead>
        <tr>
          <th
            style={{
              border: "1px solid #333",
              padding: "8px",
              textAlign: "left",
              backgroundColor: "#f0f0f0",
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {DateTimeUtils.toString(
                startDate,
                DateTimeFormat.SHORT_DAY_OF_WEEK_DESC,
              )}{" "}
              -{" "}
              {DateTimeUtils.toString(
                endDate,
                DateTimeFormat.SHORT_DAY_OF_WEEK_DESC,
              )}
              {" "} Shopping List
            </Typography>
          </th>
          <th
            style={{
              border: "1px solid #333",
              padding: "8px",
              textAlign: "left",
              width: 75,
              backgroundColor: "#f0f0f0",
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              Qty
            </Typography>
          </th>
          <th
            style={{
              border: "1px solid #333",
              padding: "8px",
              textAlign: "left",
              width: 75,
              backgroundColor: "#f0f0f0",
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              Measure
            </Typography>
          </th>
        </tr>
      </thead>
      <tbody>
        {shoppingListRows.map(({ key, description, qty, measure }) => (
          <ShoppingListRow
            key={key}
            description={description}
            qty={qty}
            measure={measure}
          />
        ))}
      </tbody>
    </table>
  );
};

export default SummaryShoppingList;
