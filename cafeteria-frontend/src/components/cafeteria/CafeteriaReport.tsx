import * as React from "react";
import {
  Box,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import User, { Role } from "../../models/User";
import { DateTimeUtils } from "../../DateTimeUtils";
import { grey } from "@mui/material/colors";
import { PantryItem, DailyMenu } from "../../models/Menu";
import { Order } from "../../models/Order";
import Student from "../../models/Student";
import SchoolYear from "../../models/SchoolYear";
import MenuItemChip from "../meals/MenuItemChip";
import HourlyMealReport from "./HourlyMealReport";
import { ExpandMore } from "@mui/icons-material";
import { getMealsAtTime, getMealsWithIrregularTimes } from "../../ReportUtils";

interface TimeRowProps {
  time: string;
  menuItems: PantryItem[];
  teachers: User[];
  date: string;
  large?: boolean;
}

interface TotalRowProps {
  menuItems: PantryItem[];
  teachers: User[];
  date: string;
  large?: boolean;
}

interface AltCafeteriaReportProps {
  date: string;
  large?: boolean;
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
    .filter((meal) => !meal.cancelled && meal.date === date)
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

const TableCell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Box
      sx={{
        borderBottomWidth: "1px",
        borderBottomColor: grey[200],
        borderBottomStyle: "solid",
        borderRightWidth: "1px",
        borderRightColor: grey[200],
        borderRightStyle: "solid",
        p: 1,
      }}
    >
      {children}
    </Box>
  );
};

const TimeRow: React.FC<TimeRowProps> = ({
  time,
  menuItems,
  teachers,
  date,
  large,
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
    <>
      <TableCell>
        <Typography variant={large ? "h4" : "body2"}>
          {DateTimeUtils.toTwelveHourTime(time)}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {itemsWithQuantities.map(({ item, quantity }) => (
            <Box
              key={`${item.name}-${item.type}`}
              sx={{
                opacity: quantity === 0 ? 0.5 : 1,
              }}
            >
              <MenuItemChip
                menuItem={item}
                textVariant={large ? "h4" : "body2"}
                qty={quantity}
              />
            </Box>
          ))}
        </Stack>
      </TableCell>
    </>
  );
};

const TotalRow: React.FC<TotalRowProps> = ({ menuItems, date, large }) => {
  const { orders } = React.useContext(AppContext);

  const itemsWithQuantities = menuItems.map((item) => ({
    item,
    quantity: orders
      .flatMap((order) => order.meals)
      .filter((meal) => !meal.cancelled && meal.date === date)
      .flatMap((meal) => meal.items)
      .filter(
        (orderedItem) =>
          item.name.toLowerCase() === orderedItem.name.toLowerCase() &&
          item.type === orderedItem.type
      ).length,
  }));

  return (
    <>
      <TableCell>
        <Typography variant={large ? "h4" : "body2"}>Total</Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {itemsWithQuantities.map(({ item, quantity }) => (
            <Box
              key={`${item.name}-${item.type}`}
              sx={{
                opacity: quantity === 0 ? 0.5 : 1,
              }}
            >
              <MenuItemChip
                menuItem={item}
                textVariant={large ? "h4" : "body2"}
                qty={quantity}
              />
            </Box>
          ))}
        </Stack>
      </TableCell>
    </>
  );
};

interface OtherRowProps {
  menuItems: PantryItem[];
  teachers: User[];
  date: string;
  large?: boolean;
}

const OtherRow: React.FC<OtherRowProps> = ({
  menuItems,
  teachers,
  date,
  large,
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
    <>
      <TableCell>
        <Typography variant={large ? "h4" : "body2"}>Other Times</Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {itemsWithQuantities.map(({ item, quantity }) => (
            <Box
              key={`${item.name}-${item.type}`}
              sx={{
                opacity: quantity === 0 ? 0.5 : 1,
              }}
            >
              <MenuItemChip
                menuItem={item}
                textVariant={large ? "h4" : "body2"}
                qty={quantity}
              />
            </Box>
          ))}
        </Stack>
      </TableCell>
    </>
  );
};

interface DailyOrderedItemsAccordionProps {
  date: string;
  menuItems: PantryItem[];
  teachers: User[];
  mealTimes: string[];
  large?: boolean;
}

const DailyOrderedItemsAccordion: React.FC<DailyOrderedItemsAccordionProps> = ({
  date,
  menuItems,
  teachers,
  mealTimes,
  large,
}) => {
  return (
    <Accordion elevation={3} defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1-content"
      >
        <Typography variant={large ? "h4" : "h6"} fontWeight="bold">
          Ordered Items
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            borderLeftWidth: "1px",
            borderLeftColor: grey[200],
            borderLeftStyle: "solid",
            borderTopWidth: "1px",
            borderTopColor: grey[200],
            borderTopStyle: "solid",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
            }}
          >
            <TableCell>
              <Typography fontWeight="bold" variant={large ? "h4" : "body1"}>
                Time
              </Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight="bold" variant={large ? "h4" : "body1"}>
                Items
              </Typography>
            </TableCell>
            {mealTimes.map((time) => (
              <TimeRow
                large={large}
                key={time}
                time={time}
                menuItems={menuItems}
                teachers={teachers}
                date={date}
              />
            ))}
            <OtherRow
              large={large}
              menuItems={menuItems}
              teachers={teachers}
              date={date}
            />
            <TotalRow
              large={large}
              menuItems={menuItems}
              teachers={teachers}
              date={date}
            />
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

const CafeteriaReport: React.FC<AltCafeteriaReportProps> = ({ date, large }) => {
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
      <DailyOrderedItemsAccordion
        date={date}
        menuItems={menuItems}
        teachers={teachers}
        mealTimes={mealTimes}
        large={large}
      />

      {/* Hourly meal reports */}
      {mealTimes.map((time) => (
        <HourlyMealReport large={large} key={time} date={date} time={time} />
      ))}
      <HourlyMealReport large={large} date={date} />
    </Box>
  );
};

export default CafeteriaReport;
