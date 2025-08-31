import * as React from "react";
import { Box, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { DateTimeFormat, DateTimeUtils, DaysOfWeek } from "../../DateTimeUtils";
import { DailyMenu, PantryItem } from "../../models/Menu";
import { Order } from "../../models/Order";

interface TotalRowProps {
  startDate: string;
  endDate: string;
}

interface ShoppingListProps {
  startDate: string;
  endDate: string;
}

// Reuse these utility functions from CafeteriaReport
const getMenuItems = (
  orders: Order[],
  scheduledMenus: DailyMenu[],
  date: string
): PantryItem[] => {
  const orderedItems: PantryItem[] = [];

  orders
    .flatMap((order) => order.meals)
    .filter((meal) => meal.date === date)
    .flatMap((meal) => meal.items)
    .forEach((orderedItem) => {
      const matchingItem = orderedItems.find(
        (item) =>
          item.name.toLowerCase() === orderedItem.name.toLowerCase() &&
          item.type === orderedItem.type
      );
      if (!matchingItem) {
        orderedItems.push(orderedItem);
      }
    });

  const scheduledMenu = scheduledMenus.find((menu) => menu.date === date);
  const servedItems: PantryItem[] = scheduledMenu?.items ?? [];

  servedItems.forEach((orderedItem) => {
    const matchingItem = orderedItems.find(
      (item) =>
        item.name.toLowerCase() === orderedItem.name.toLowerCase() &&
        item.type === orderedItem.type
    );
    if (!matchingItem) {
      orderedItems.push(orderedItem);
    }
  });

  return orderedItems;
};

const DailyShoppingList: React.FC<TotalRowProps> = ({ startDate, endDate }) => {
  const { orders, scheduledMenus } = React.useContext(AppContext);

  let currentDate = startDate;
  const dates: string[] = [];
  while (currentDate <= endDate) {
    if (!DateTimeUtils.dateFallsOnDayOfWeek(currentDate, DaysOfWeek.WEEKENDS)) {
      dates.push(currentDate);
    }
    currentDate = DateTimeUtils.toString(DateTimeUtils.addDays(currentDate, 1));
  }

  const rows: JSX.Element[] = [];
  let totalItems: {item: PantryItem, quantity: number}[] = [];

  dates.forEach((date) => {
    const menuItems = getMenuItems(orders, scheduledMenus, date).sort(
      (item1, item2) =>
        item1.type - item2.type ||
        item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
    );

    const itemsWithQuantities = menuItems.map((item) => ({
      item,
      quantity: orders
        .flatMap((order) => order.meals)
        .filter((meal) => meal.date === date)
        .flatMap((meal) => meal.items)
        .filter(
          (orderedItem) =>
            item.name.toLowerCase() === orderedItem.name.toLowerCase() &&
            item.type === orderedItem.type
        ).length,
    }));

    totalItems = totalItems.concat(itemsWithQuantities);

    rows.push(
      <tr>
        <td
          style={{
            border: "1px solid #333",
            padding: "8px",
            textAlign: "left",
          }}
        >
          <Typography variant="body2">
            {DateTimeUtils.toString(
              date,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            )}
          </Typography>
        </td>
        <td
          style={{
            border: "1px solid #333",
            padding: "8px",
            textAlign: "left",
          }}
        >
          <Typography variant="body2">
            {itemsWithQuantities
              .map(({ item, quantity }) => item.name + " " + quantity)
              .join(", ")}
          </Typography>
        </td>
      </tr>
    );
  });

  // Consolidate duplicate items by summing quantities
  const consolidatedItems = totalItems.reduce((acc, { item, quantity }) => {
    const existingItem = acc.find(
      existing => 
        existing.item.name.toLowerCase() === item.name.toLowerCase() &&
        existing.item.type === item.type
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      acc.push({ item, quantity });
    }
    
    return acc;
  }, [] as {item: PantryItem, quantity: number}[]);

  // Sort consolidated items by type and name
  const sortedConsolidatedItems = consolidatedItems.sort(
    (item1, item2) =>
      item1.item.type - item2.item.type ||
      item1.item.name.toLowerCase().localeCompare(item2.item.name.toLowerCase())
  );

  // Add total row
  rows.push(
    <tr>
      <td
        style={{
          border: "1px solid #333",
          padding: "8px",
          textAlign: "left",
          fontWeight: "bold",
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          Total
        </Typography>
      </td>
      <td
        style={{
          border: "1px solid #333",
          padding: "8px",
          textAlign: "left",
        }}
      >
        <Typography variant="body2">
          {sortedConsolidatedItems
            .map(({ item, quantity }) => item.name + " " + quantity)
            .join(", ")}
        </Typography>
      </td>
    </tr>
  );

  return <>{rows}</>;
};

const PrintableShoppingList: React.FC<ShoppingListProps> = ({
  startDate,
  endDate,
}) => {
  let date = startDate;
  const dates: string[] = [];
  while (date <= endDate) {
    if (!DateTimeUtils.dateFallsOnDayOfWeek(date, DaysOfWeek.WEEKENDS)) {
      dates.push(date);
    }
    date = DateTimeUtils.toString(DateTimeUtils.addDays(date, 1));
  }

  return (
    <Box sx={{ pageBreakBefore: "always" }}>
      <Box>
        <Typography variant="body1" fontWeight="bold">
          Shopping List for
          {" " +
            DateTimeUtils.toString(
              startDate,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            )}
          {" - " +
            DateTimeUtils.toString(
              endDate,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            )}
        </Typography>
      </Box>
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
                width: "250px",
                padding: "8px",
                textAlign: "left",
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Date
              </Typography>
            </th>
            <th
              style={{
                border: "1px solid #333",
                padding: "8px",
                textAlign: "left",
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Shopping List
              </Typography>
            </th>
          </tr>
        </thead>
        <tbody>
            <DailyShoppingList startDate={startDate} endDate={endDate} />
        </tbody>
      </table>
    </Box>
  );
};

export default PrintableShoppingList;
