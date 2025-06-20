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
import Meal from "../../models/Meal";
import MenuItemChip from "../meals/MenuItemChip";
import HourlyMealReport from "./HourlyMealReport";
import { ExpandMore } from "@mui/icons-material";

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

const getAssignedLunchtime = (
  student: Student | undefined,
  date: string,
  schoolYear: SchoolYear,
  teachers: User[]
) => {
  if (student === undefined) {
    return undefined;
  }

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const studentLunchTime = schoolYear.studentLunchTimes.find(
    (lt) => lt.studentId === student.id && lt.dayOfWeek === dayOfWeek
  );

  if (studentLunchTime?.teacherId) {
    const teacher = teachers.find((t) => t.id === studentLunchTime.teacherId);
    if (teacher) {
      const teacherLunchTime = schoolYear.teacherLunchTimes.find(
        (tlt) => tlt.teacherId === teacher.id && tlt.dayOfWeek === dayOfWeek
      );
      return teacherLunchTime?.times[0];
    }
  }

  const gradeLunchTime = schoolYear.gradeLunchTimes.find(
    (glt) =>
      glt.grade === studentLunchTime?.grade && glt.dayOfWeek === dayOfWeek
  );

  return gradeLunchTime?.times[0];
};

const getMealsAtTime = (
  orders: Order[],
  teachers: User[],
  students: Student[],
  schoolYear: SchoolYear,
  date: string,
  time: string
) => {
  return orders
    .flatMap((order) => order.meals)
    .filter(
      (meal: Meal) =>
        meal.date === date &&
        (meal.time === time ||
          getAssignedLunchtime(
            students.find((student) => student.id === meal.studentId),
            date,
            schoolYear,
            teachers
          ) === time)
    );
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
        <Typography variant="body1" fontWeight="bold">
          {DateTimeUtils.toTwelveHourTime(time)}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {itemsWithQuantities.map(({ item, quantity }) => (
            <Box
              key={`${item.name}-${item.type}`}
              sx={{
                m: 0.5,
                opacity: quantity === 0 ? 0.5 : 1,
              }}
            >
              <MenuItemChip
                menuItem={item}
                textVariant="body2"
                qty={quantity}
              />
            </Box>
          ))}
        </Stack>
      </TableCell>
    </>
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
    <>
      <TableCell>
        <Typography variant="body1" fontWeight="bold">
          Total
        </Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {itemsWithQuantities.map(({ item, quantity }) => (
            <Box
              key={`${item.name}-${item.type}`}
              sx={{
                m: 0.5,
                opacity: quantity === 0 ? 0.5 : 1,
              }}
            >
              <MenuItemChip
                menuItem={item}
                textVariant="body2"
                qty={quantity}
              />
            </Box>
          ))}
        </Stack>
      </TableCell>
    </>
  );
};

const getMealsWithIrregularTimes = (
  orders: Order[],
  teachers: User[],
  students: Student[],
  schoolYear: SchoolYear,
  date: string
) => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const lunchTimes =
    schoolYear.lunchTimes.find((lt) => lt.dayOfWeek === dayOfWeek)?.times ?? [];

  return orders
    .flatMap((order) => order.meals)
    .filter(
      (meal) =>
        meal.date === date &&
        !lunchTimes.includes(meal.time) &&
        !lunchTimes.includes(
          getAssignedLunchtime(
            students.find((student) => student.id === meal.studentId),
            date,
            schoolYear,
            teachers
          ) ?? ""
        )
    );
};

interface OtherRowProps {
  menuItems: PantryItem[];
  teachers: User[];
  date: string;
}

const OtherRow: React.FC<OtherRowProps> = ({ menuItems, teachers, date }) => {
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
        <Typography variant="body1" fontWeight="bold">
          Other Times
        </Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {itemsWithQuantities.map(({ item, quantity }) => (
            <Box
              key={`${item.name}-${item.type}`}
              sx={{
                m: 0.5,
                opacity: quantity === 0 ? 0.5 : 1,
              }}
            >
              <MenuItemChip
                menuItem={item}
                textVariant="body2"
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
}

const DailyOrderedItemsAccordion: React.FC<DailyOrderedItemsAccordionProps> = ({
  date,
  menuItems,
  teachers,
  mealTimes,
}) => {
  return (
    <Accordion elevation={3} defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1-content"
      >
        <Typography fontWeight="bold">Ordered Items</Typography>
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
              <Typography fontWeight="bold" variant="body1">
                Time
              </Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight="bold" variant="body1">
                Items
              </Typography>
            </TableCell>
            {mealTimes.map((time) => (
              <TimeRow
                key={time}
                time={time}
                menuItems={menuItems}
                teachers={teachers}
                date={date}
              />
            ))}
            <OtherRow menuItems={menuItems} teachers={teachers} date={date} />
            <TotalRow menuItems={menuItems} teachers={teachers} date={date} />
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

const AltCafeteriaReport: React.FC<AltCafeteriaReportProps> = ({ date }) => {
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
      />

      {/* Hourly meal reports */}
      {mealTimes.map((time) => (
        <HourlyMealReport key={time} date={date} time={time} />
      ))}
      <HourlyMealReport date={date} />
    </Box>
  );
};

export default AltCafeteriaReport;
