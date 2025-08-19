import * as React from "react";
import { Box, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import User, { Role } from "../../models/User";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { PantryItem, DailyMenu } from "../../models/Menu";
import { Order } from "../../models/Order";
import Student from "../../models/Student";
import SchoolYear from "../../models/SchoolYear";
import PrintableHourlyMealReport from "./PrintableHourlyMealReport";
import { getMealsAtTime, getMealsWithIrregularTimes } from "../../ReportUtils";

interface TimeRowProps {
  time: string;
  menuItems: PantryItem[];
  teachers: User[];
  date: string;
}

interface TotalRowProps {
  menuItems: PantryItem[];
  teachers: User[];
  date: string;
}

interface AltCafeteriaReportProps {
  date: string;
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


const getOrderedQty = (
  orders: Order[],
  menuItem: PantryItem,
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
      (orderedItem) =>
        menuItem.name.toLowerCase() === orderedItem.name.toLowerCase() &&
        menuItem.type === orderedItem.type
    ).length;
};

const TimeRow: React.FC<TimeRowProps> = ({
  time,
  menuItems,
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

const TotalRow: React.FC<TotalRowProps> = ({ menuItems, date }) => {
  const { orders } = React.useContext(AppContext);

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

interface OtherRowProps {
  menuItems: PantryItem[];
  teachers: User[];
  date: string;
}

const OtherRow: React.FC<OtherRowProps> = ({
  menuItems,
  teachers,
  date,
}) => {
  const { students, currentSchoolYear, orders } = React.useContext(AppContext);

  const itemsWithQuantities = menuItems.map((item) => ({
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
        (orderedItem) =>
          item.name.toLowerCase() === orderedItem.name.toLowerCase() &&
          item.type === orderedItem.type
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
          <Typography variant="body2">Other/Unknown Times</Typography>
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

interface DailyOrderedItemsAccordionProps {
  date: string;
  menuItems: PantryItem[];
  teachers: User[];
  mealTimes: string[];
}

const DailyItemCountsTable: React.FC<DailyOrderedItemsAccordionProps> = ({
  date,
  menuItems,
  teachers,
  mealTimes,
}) => {
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
              menuItems={menuItems}
              teachers={teachers}
              date={date}
            />
          ))}
          <OtherRow
            menuItems={menuItems}
            teachers={teachers}
            date={date}
          />
          <TotalRow
            menuItems={menuItems}
            teachers={teachers}
            date={date}
          />
        </tbody>
      </table>
    </Box>
  );
};

const PrintableCafeteriaReport: React.FC<AltCafeteriaReportProps> = ({
  date,
}) => {
  const { scheduledMenus, users, orders, currentSchoolYear } =
    React.useContext(AppContext);

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const dailyTimes = currentSchoolYear.lunchTimes.find(
    (lt) => lt.dayOfWeek === dayOfWeek
  );
  const mealTimes = dailyTimes?.times.sort() ?? [];

  const menuItems = getMenuItems(orders, scheduledMenus, date).sort(
    (item1, item2) =>
      item1.type - item2.type ||
      item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
  );

  const teachers = users.filter((user) => user.role === Role.TEACHER);

  return (
    <Box p={2}>
      <DailyItemCountsTable
        date={date}
        menuItems={menuItems}
        teachers={teachers}
        mealTimes={mealTimes}
      />

      {/* Hourly meal reports */}
      {mealTimes.map((time) => (
        <PrintableHourlyMealReport
          key={time}
          date={date}
          time={time}
        />
      ))}
      <PrintableHourlyMealReport date={date} />
    </Box>
  );
};

export default PrintableCafeteriaReport;
