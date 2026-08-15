import * as React from "react";
import { Box, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import User, { Role } from "../../models/User";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import DailyMenu from "../../models/DailyMenu";
import { Order } from "../../models/Order";
import Student from "../../models/Student";
import SchoolYear from "../../models/SchoolYear";
import { getMealsAtTime, getMealsWithIrregularTimes } from "../../ReportUtils";
import PantryItem from "../../models/PantryItem";

interface TimeRowProps {
  time: string;
  pantryItems: PantryItem[];
  teachers: User[];
  date: string;
}

interface TotalRowProps {
  pantryItems: PantryItem[];
  date: string;
}

interface OtherRowProps {
  pantryItems: PantryItem[];
  teachers: User[];
  date: string;
}

interface DailyOrderedItemsAccordionProps {
  date: string;
}

// Reuse these utility functions from CafeteriaReport
const getPantryItems = (
  allPantryItems: PantryItem[],
  orders: Order[],
  scheduledMenus: DailyMenu[],
  date: string
): PantryItem[] => {
  const scheduledMenu = scheduledMenus.find((menu) => menu.date === date);
  const pantryItemIds = orders
    .flatMap((order) => order.meals)
    .filter((meal) => !meal.cancelled && meal.date === date)
    .flatMap((meal) => meal.items)
    .map((mealItem) => mealItem.pantryItemId);
  pantryItemIds.push(...scheduledMenu?.items.map((item) => item.pantryItemId) ?? []);

  return allPantryItems.filter((pantryItem) => pantryItemIds.includes(pantryItem.id));
};

const getOrderedQty = (
  orders: Order[],
  pantryItem: PantryItem,
  teachers: User[],
  students: Student[],
  schoolYear: SchoolYear,
  date: string,
  time: string
): number => {
  const meals = getMealsAtTime(
    orders,
    teachers,
    students,
    schoolYear,
    date,
    time
  );
  return meals
    .flatMap((meal) => meal.items)
    .filter(
      (mealItem) =>
        pantryItem.id === mealItem.pantryItemId
    ).length;
};

const TimeRow: React.FC<TimeRowProps> = ({
  time,
  pantryItems: menuItems,
  teachers,
  date,
}) => {
  const { currentSchoolYear, orders, students } = React.useContext(AppContext);

  const itemsWithQuantities = menuItems.map((item) => ({
    item,
    quantity: getOrderedQty(
      orders,
      item,
      teachers,
      students,
      currentSchoolYear,
      date,
      time
    ),
  }));

  return (
    <tr>
      <td
        style={{
          border: "1px solid #333",
          padding: "8px",
          textAlign: "left",
        }}
      >
        <Typography variant="body2">
          {DateTimeUtils.toTwelveHourTime(time)}
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
};

const TotalRow: React.FC<TotalRowProps> = ({ pantryItems, date }) => {
  const { orders } = React.useContext(AppContext);

  const itemsWithQuantities = pantryItems.map((item) => ({
    item,
    quantity: orders
      .flatMap((order) => order.meals)
      .filter((meal) => !meal.cancelled && meal.date === date)
      .flatMap((meal) => meal.items)
      .filter(
        (mealItem) =>
          item.id === mealItem.pantryItemId
      ).length,
  }));

  return (
    <tr>
      <td
        style={{
          border: "1px solid #333",
          padding: "8px",
          textAlign: "left",
        }}
      >
        <Typography variant="body2">Total</Typography>
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
};

const OtherRow: React.FC<OtherRowProps> = ({
  pantryItems,
  teachers,
  date,
}) => {
  const { students, currentSchoolYear, orders } = React.useContext(AppContext);

  const itemsWithQuantities = pantryItems.map((item) => ({
    item,
    quantity: getMealsWithIrregularTimes(
      orders,
      teachers,
      students,
      currentSchoolYear,
      date
    )
      .flatMap((meal) => meal.items)
      .filter(
        (mealItem) =>
          item.id === mealItem.pantryItemId
      ).length,
  }));

  return (
      <tr>
        <td
          style={{
            border: "1px solid #333",
            padding: "8px",
            textAlign: "left",
          }}
        >
          <Typography variant="body2">Other Times</Typography>
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
};

const PrintableDailySummary: React.FC<DailyOrderedItemsAccordionProps> = ({
  date,
}) => {
  const {currentSchoolYear, orders, scheduledMenus, users, pantryItems: allPantryItems} = React.useContext(AppContext);

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const dailyTimes = currentSchoolYear.lunchTimes.find(
    (lt) => lt.dayOfWeek === dayOfWeek
  );
  const mealTimes = dailyTimes?.times.sort() ?? [];

  const pantryItems = getPantryItems(allPantryItems, orders, scheduledMenus, date).sort(
    (item1, item2) =>
      item1.type - item2.type ||
      item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
  );

  const teachers = users.filter((user) => user.role === Role.TEACHER);

  return (
    <Box sx={{ pageBreakBefore: "always" }}>
      <Box>
        <Typography variant="body1" fontWeight="bold">
          Cafeteria Summary for {" "}
          {DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}
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
                Time
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
                Meal Items
              </Typography>
            </th>
          </tr>
        </thead>
        <tbody>
          {mealTimes.map((time) => (
            <TimeRow
              key={time}
              time={time}
              pantryItems={pantryItems}
              teachers={teachers}
              date={date}
            />
          ))}
          <OtherRow
            pantryItems={pantryItems}
            teachers={teachers}
            date={date}
          />
          <TotalRow
            pantryItems={pantryItems}
            date={date}
          />
        </tbody>
      </table>
    </Box>
  );
};

export default PrintableDailySummary;
