import * as React from "react";
import { Typography } from "@mui/material";
import { DateTimeFormat, DateTimeUtils, DaysOfWeek } from "../../DateTimeUtils";
import PantryItem from "../../models/PantryItem";
import { AppContext } from "../../AppContextProvider";
import DailyMenu from "../../models/DailyMenu";
import { Order } from "../../models/Order";

interface DailyShoppingListProps {
  date: string;
}

interface ShoppingListRowProps {
  description: string;
  qty: number;
  measure: string;
  bold?: boolean;
}

const ShoppingListRow: React.FC<ShoppingListRowProps> = ({
  description,
  qty,
  measure,
  bold,
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
        <Typography
          variant="caption"
          fontWeight={bold ? "bold" : undefined}
          sx={bold ? undefined : { pl: 2 }}
        >
          {description}
        </Typography>
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

const DailyShoppingList: React.FC<DailyShoppingListProps> = ({ date }) => {
  const {
    orders,
    scheduledMenus,
    pantryItems: allPantryItems,
  } = React.useContext(AppContext);

  if (DateTimeUtils.dateFallsOnDayOfWeek(date, DaysOfWeek.WEEKENDS)) {
    return <></>;
  }

  let totalItems: { item: PantryItem; quantity: number }[] = [];

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

  const shoppingListRows = sortedConsolidatedItems.flatMap(
    ({ item, quantity }) => {
      const servingSize = item.recipeServingSize || 1;
      const pantryRow = {
        key: String(item.id),
        description: item.name,
        qty: ceilQty(quantity),
        measure: "each",
        bold: true,
      };

      if (!item.recipeItems?.length) {
        return [pantryRow];
      }

      return [
        pantryRow,
        ...item.recipeItems.map((recipeItem) => ({
          key: `${item.id}-${recipeItem.id}`,
          description: recipeItem.description,
          qty: ceilQty((quantity * recipeItem.qty) / servingSize),
          measure: recipeItem.unitOfMeasure ?? "",
          bold: false,
        })),
      ];
    },
  );

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
                date,
                DateTimeFormat.SHORT_DAY_OF_WEEK_DESC,
              )}{" "}
              Shopping List
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
        {shoppingListRows.map(({ key, description, qty, measure, bold }) => (
          <ShoppingListRow
            key={key}
            description={description}
            qty={qty}
            measure={measure}
            bold={bold}
          />
        ))}
      </tbody>
    </table>
  );
};

export default DailyShoppingList;
