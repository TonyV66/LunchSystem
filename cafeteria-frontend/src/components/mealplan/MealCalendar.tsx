import React, { useRef } from "react";
import {
  Box,
  IconButton,
  Menu as PulldownMenu,
  MenuItem,
  Paper,
  Typography,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  DateTimeFormat,
  DateTimeUtils,
  MONTH_NAMES,
  SHORT_DAY_NAMES,
} from "../../DateTimeUtils";
import { AppContext } from "../../AppContextProvider";
import { useContext, useEffect, useState } from "react";
import MenuPanel from "../menus/MenuPanel";
import {
  AccessTime,
  AccessTimeTwoTone,
  AddShoppingCart,
  ContentPasteGo,
  ExpandMore,
  ManageSearch,
  MoreVert,
} from "@mui/icons-material";
import Menu, { DailyMenu } from "../../models/Menu";
import {
  deleteDailyMenu,
  saveDailyMenu,
  updateDailyMenuAvailability,
} from "../../api/CafeteriaClient";
import EditMenuDialog from "../menus/EditMenuDialog";
import DateTimeSelectionDialog from "../DateTimeSelectionDialog";
import {
  RelativeDateCountType,
  RelativeDateTarget,
} from "../settings/AdminSettingsPage";
import DailyMealsDialog from "../meals/DailyMealsDialog";
import AddToCartDialog from "../shoppingcart/AddToCartDialog";
import { Role } from "../../models/User";
import CafeteriaDialog from "../cafeteria/CafeteriaDialog";
import ClassroomMealsDialog from "../meals/ClassroomMealsDialog";
import { AxiosError } from "axios";
import OrderDatesDialog from "./OrderDatesDialog";

interface MealPlanProps {
  menuOrDate: DailyMenu | string;
  clipboardMenu?: Menu;
  disabled?: boolean;
}

interface AdminMealButtonProps extends MealPlanProps {
  onMenuChanged: (menu?: DailyMenu) => void;
}

interface ParentMealButtonProps {
  menuOrDate: DailyMenu | string;
}

interface CafeteriaMealButtonProps {
  menuOrDate: DailyMenu | string;
}

const getOrderDates = (menu?: DailyMenu): string => {
  if (!menu) {
    return "";
  }
  const startDate = new Date(menu.orderStartTime);
  const endDate = new Date(menu.orderEndTime);

  return (
    DateTimeUtils.toString(startDate, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC) +
    " @" +
    startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " - " +
    DateTimeUtils.toString(endDate, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC) +
    " @" +
    endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const isAcceptingOrders = (menu?: DailyMenu) => {
  const now = new Date();
  return (
    menu &&
    new Date(menu.orderStartTime) <= now &&
    new Date(menu.orderEndTime) > now
  );
};

const willBeAcceptingOrders = (menu?: DailyMenu) => {
  const now = new Date();
  return menu && new Date(menu.orderEndTime) > now;
};

const AdminMealButtons: React.FC<AdminMealButtonProps> = ({
  menuOrDate,
  clipboardMenu,
  disabled,
  onMenuChanged,
}) => {
  const {
    scheduledMenus,
    setScheduledMenus,
    school: schoolSettings,
    orders,
    setSnackbarErrorMsg,
  } = useContext(AppContext);
  const [menu, setMenu] = useState(
    typeof menuOrDate === "string" ? undefined : (menuOrDate as DailyMenu)
  );
  const [editAvail, setEditAvail] = useState(false);
  const [editMenu, setEditMenu] = useState(false);
  const [showCafeteriaReport, setShowCafeteriaReport] = useState(false);
  const [showClassroomReport, setShowClassroomReport] = useState(false);

  const dateStr = menu?.date ?? (menuOrDate as string);
  const date = DateTimeUtils.toDate(dateStr);

  const hasOrderedMeals = orders
    .flatMap((order) => order.meals)
    .find((meal) => meal.date === dateStr)
    ? true
    : false;

  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);

  const calculateOrderTime = (
    mealDate: Date,
    periodCount: number,
    periodType: number,
    relativeTo: number,
    time: string
  ) => {
    const targetDate =
      relativeTo === RelativeDateTarget.DAY_MEAL_IS_SERVED
        ? mealDate
        : DateTimeUtils.getFirstDayOfWeek(mealDate);
    const numDays =
      periodType === RelativeDateCountType.DAYS ? periodCount : periodCount * 7;
    const orderDate = DateTimeUtils.addDays(targetDate, -numDays);
    return new Date(DateTimeUtils.toString(orderDate) + " " + time);
  };

  const calculateOrderStartTime = (mealDate: Date) => {
    return calculateOrderTime(
      mealDate,
      schoolSettings.orderStartPeriodCount,
      schoolSettings.orderStartPeriodType,
      schoolSettings.orderStartRelativeTo,
      schoolSettings.orderStartTime
    );
  };

  const calculateOrderEndTime = (mealDate: Date) => {
    return calculateOrderTime(
      mealDate,
      schoolSettings.orderEndPeriodCount,
      schoolSettings.orderEndPeriodType,
      schoolSettings.orderEndRelativeTo,
      schoolSettings.orderEndTime
    );
  };

  const handleCloseMenu = () => {
    setPulldownMenuAnchor(null);
  };

  const handleMenuSaved = (savedMenu: Menu) => {
    setScheduledMenus(
      scheduledMenus.map((sm) => (sm !== menu ? sm : (savedMenu as DailyMenu)))
    );

    setMenu(savedMenu as DailyMenu);
    onMenuChanged(savedMenu as DailyMenu);
    setEditMenu(false);
  };

  const handleDatesChanged = async (startDate: Date, endDate: Date) => {
    try {
      await updateDailyMenuAvailability(menu!, startDate, endDate);
      const updatedMenu = {
        ...menu!,
        orderStartTime: startDate.toJSON(),
        orderEndTime: endDate.toJSON(),
      };
      setScheduledMenus(
        scheduledMenus.map((sm) => (sm !== menu ? sm : updatedMenu))
      );
      setMenu(updatedMenu);
      onMenuChanged(updatedMenu);
      setEditAvail(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error updating order dates: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const handleDeleteClicked = async () => {
    setPulldownMenuAnchor(null);
    try {
      await deleteDailyMenu(menu!.id);
      setScheduledMenus(scheduledMenus.filter((sm) => sm !== menu));
      setMenu(undefined);
      onMenuChanged(undefined);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error removing menu from schedule: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const handleEditClicked = () => {
    setPulldownMenuAnchor(null);
    setEditMenu(true);
  };

  const handleShowCafeteriaReport = () => {
    setPulldownMenuAnchor(null);
    setShowCafeteriaReport(true);
  };

  const handleShowClassroomReport = () => {
    setPulldownMenuAnchor(null);
    setShowClassroomReport(true);
  };

  const handleShowMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPulldownMenuAnchor(event.currentTarget);
  };

  const handlePasteMenu = async () => {
    const dateString = DateTimeUtils.toString(date);

    const oldMenu = scheduledMenus.find((menu) => menu.date === dateString);
    const newMenu: DailyMenu = {
      ...clipboardMenu!,
      date: DateTimeUtils.toString(date),
      orderStartTime: calculateOrderStartTime(date).toISOString(),
      orderEndTime: calculateOrderEndTime(date).toISOString(),
    };

    try {
      const savedMenu = await saveDailyMenu(newMenu);

      if (oldMenu) {
        setScheduledMenus(
          scheduledMenus.map((menu) => (menu === oldMenu ? savedMenu : menu))
        );
      } else {
        setScheduledMenus(scheduledMenus.concat(savedMenu));
      }

      setMenu(savedMenu);
      onMenuChanged(savedMenu);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error scheduling menu: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Typography sx={{ flexGrow: 1 }} fontWeight="bold" variant="caption">
        {SHORT_DAY_NAMES[date.getDay()]}
      </Typography>

      {disabled || !menu ? (
        <IconButton color="primary" disabled={true} size="small">
          {isAcceptingOrders(menu) ? <AccessTimeTwoTone /> : <AccessTime />}
        </IconButton>
      ) : (
        <Tooltip
          title={
            <div style={{ whiteSpace: "pre-line" }}>
              Accepting orders:
              <br />
              {getOrderDates(menu)}
            </div>
          }
        >
          <IconButton
            color="primary"
            onClick={() => setEditAvail(true)}
            size="small"
          >
            {isAcceptingOrders(menu) ? <AccessTimeTwoTone /> : <AccessTime />}
          </IconButton>
        </Tooltip>
      )}
      <IconButton
        color="primary"
        disabled={disabled || !clipboardMenu}
        onClick={handlePasteMenu}
        size="small"
      >
        <ContentPasteGo />
      </IconButton>
      <IconButton
        color="primary"
        disabled={disabled || !menu}
        onClick={handleShowMenu}
        size="small"
      >
        <MoreVert />
      </IconButton>
      {!pulldownMenuAnchor ? (
        <></>
      ) : (
        <PulldownMenu
          id="demo-positioned-menu"
          aria-labelledby="demo-positioned-button"
          anchorEl={pulldownMenuAnchor}
          open={true}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <MenuItem onClick={handleEditClicked}>Edit Menu</MenuItem>
          <MenuItem
            disabled={!hasOrderedMeals}
            onClick={handleShowClassroomReport}
          >
            Classroom Reports
          </MenuItem>
          <MenuItem
            disabled={!hasOrderedMeals}
            onClick={handleShowCafeteriaReport}
          >
            Cafeteria Report
          </MenuItem>
          <MenuItem onClick={handleDeleteClicked}>Delete</MenuItem>
        </PulldownMenu>
      )}
      {editAvail && (
        <DateTimeSelectionDialog
          onOk={handleDatesChanged}
          onCancel={() => setEditAvail(false)}
          dateOnly={false}
          startDate={new Date(menu!.orderStartTime)}
          endDate={new Date(menu!.orderEndTime)}
        ></DateTimeSelectionDialog>
      )}
      {editMenu ? (
        <EditMenuDialog
          menu={menu}
          onCancel={() => setEditMenu(false)}
          onOk={handleMenuSaved}
        />
      ) : (
        <></>
      )}
      {showCafeteriaReport ? (
        <CafeteriaDialog
          date={menu!.date}
          onClose={() => setShowCafeteriaReport(false)}
        />
      ) : (
        <></>
      )}
      {showClassroomReport ? (
        <ClassroomMealsDialog
          date={menu!.date}
          onClose={() => setShowClassroomReport(false)}
        />
      ) : (
        <></>
      )}
    </Box>
  );
};

const TeacherMealButtons: React.FC<CafeteriaMealButtonProps> = ({
  menuOrDate,
}) => {
  const { orders, students, user } = useContext(AppContext);
  const [showReport, setShowReport] = useState(false);

  const menu =
    typeof menuOrDate === "string" ? undefined : (menuOrDate as DailyMenu);
  const date = menu?.date ?? (menuOrDate as string);

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const studentIds = students
    .filter((student) =>
      student.lunchTimes.find(
        (lt) => lt.dayOfWeek === dayOfWeek && lt.teacherId == user.id
      )
        ? true
        : false
    )
    .map((student) => student.id);

  const hasOrderedMeals = orders
    .flatMap((order) => order.meals)
    .find((meal) => meal.date === date && studentIds.includes(meal.studentId))
    ? true
    : false;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Typography
        sx={{ flexGrow: 1 }}
        textAlign="left"
        fontWeight="bold"
        variant="caption"
      >
        {SHORT_DAY_NAMES[DateTimeUtils.toDate(date).getDay()]}
      </Typography>
      <IconButton
        color="primary"
        disabled={!menu || !hasOrderedMeals}
        onClick={() => setShowReport(true)}
        size="small"
      >
        <ManageSearch />
      </IconButton>
      {showReport ? (
        <ClassroomMealsDialog
          teacherId={user.id}
          date={date}
          onClose={() => setShowReport(false)}
        />
      ) : (
        <></>
      )}
    </Box>
  );
};

const CafeteriaMealButtons: React.FC<CafeteriaMealButtonProps> = ({
  menuOrDate,
}) => {
  const { orders } = useContext(AppContext);
  const [showReport, setShowReport] = useState(false);

  const menu =
    typeof menuOrDate === "string" ? undefined : (menuOrDate as DailyMenu);
  const date = menu?.date ?? (menuOrDate as string);

  const hasOrderedMeals = orders
    .flatMap((order) => order.meals)
    .find((meal) => meal.date === date)
    ? true
    : false;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Typography
        sx={{ flexGrow: 1 }}
        textAlign="left"
        fontWeight="bold"
        variant="caption"
      >
        {SHORT_DAY_NAMES[DateTimeUtils.toDate(date).getDay()]}
      </Typography>
      <IconButton
        color="primary"
        disabled={!menu || !hasOrderedMeals}
        onClick={() => setShowReport(true)}
        size="small"
      >
        <ManageSearch />
      </IconButton>
      {showReport ? (
        <CafeteriaDialog date={date} onClose={() => setShowReport(false)} />
      ) : (
        <></>
      )}
    </Box>
  );
};

const ParentMealButtons: React.FC<ParentMealButtonProps> = ({ menuOrDate }) => {
  const { orders, shoppingCart } = useContext(AppContext);

  const menu =
    typeof menuOrDate === "string" ? undefined : (menuOrDate as DailyMenu);
  const date = menu?.date ?? (menuOrDate as string);

  const [showOrderedMeals, setShowOrderedMeals] = useState(false);
  // const [showAvailability, setShowAvailability] = useState(false);
  const [addToCart, setAddToCart] = useState(false);
  const [showOrderDates, setShowOrderDates] = useState(false);
  const [hasMealsInCart, setHasMealsInCart] = useState(
    shoppingCart.items.find((item) => item.dailyMenuId === menu?.id)
      ? true
      : false
  );

  const hasOrderedMeals = orders
    .flatMap((order) => order.meals)
    .find((meal) => meal.date === date)
    ? true
    : false;

  const handleMealAddedToCart = () => {
    setAddToCart(false);
    setHasMealsInCart(true);
  };

  const currentlyAcceptingOrders = isAcceptingOrders(menu);
  const willAcceptOrderInFuture = willBeAcceptingOrders(menu);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Typography
        sx={{ flexGrow: 1 }}
        textAlign="left"
        fontWeight="bold"
        variant="caption"
      >
        {SHORT_DAY_NAMES[DateTimeUtils.toDate(date).getDay()]}
      </Typography>
      <IconButton
        color="primary"
        disabled={!hasOrderedMeals && !hasMealsInCart}
        onClick={() => setShowOrderedMeals(true)}
        size="small"
      >
        <ManageSearch />
      </IconButton>
      <IconButton
        color={
          !currentlyAcceptingOrders && willAcceptOrderInFuture
            ? "warning"
            : "primary"
        }
        disabled={!currentlyAcceptingOrders && !willAcceptOrderInFuture}
        onClick={
          currentlyAcceptingOrders
            ? () => setAddToCart(true)
            : () => setShowOrderDates(true)
        }
        size="small"
      >
        <AddShoppingCart />
      </IconButton>
      {showOrderedMeals ? (
        <DailyMealsDialog
          onClose={() => setShowOrderedMeals(false)}
          date={date}
        />
      ) : (
        <></>
      )}
      {addToCart ? (
        <AddToCartDialog
          onClose={() => setAddToCart(false)}
          onAddedToCart={handleMealAddedToCart}
          date={date}
        />
      ) : (
        <></>
      )}
      {showOrderDates ? (
        <OrderDatesDialog
          onClose={() => setShowOrderDates(false)}
          menu={menu!}
        />
      ) : (
        <></>
      )}
    </Box>
  );
};

const MealPlan: React.FC<MealPlanProps> = ({
  menuOrDate,
  clipboardMenu,
  disabled,
}) => {
  const { user } = useContext(AppContext);
  const [menu, setMenu] = useState(
    typeof menuOrDate === "string" ? undefined : (menuOrDate as DailyMenu)
  );

  const tmpDate = menu?.date ?? (menuOrDate as string);
  if (!tmpDate) {
    console.log("Here I am");
  }

  const date = useRef(
    DateTimeUtils.toDate(
      typeof menuOrDate === "string"
        ? menuOrDate
        : (menuOrDate as DailyMenu).date
    )
  );

  const backgroundImage = "/" + date.current.getDate() + ".svg";
  const handleMenuChanged = (menu?: DailyMenu) => {
    setMenu(menu);
  };

  let buttonBar = (
    <CafeteriaMealButtons
      menuOrDate={menu ?? DateTimeUtils.toString(date.current)}
    ></CafeteriaMealButtons>
  );
  switch (user.role) {
    case Role.TEACHER:
      buttonBar = (
        <TeacherMealButtons
          menuOrDate={menu ?? DateTimeUtils.toString(date.current)}
        ></TeacherMealButtons>
      );
      break;
    case Role.PARENT:
      buttonBar = (
        <ParentMealButtons
          menuOrDate={menu ?? DateTimeUtils.toString(date.current)}
        ></ParentMealButtons>
      );
      break;
    case Role.ADMIN:
      buttonBar = (
        <AdminMealButtons
          menuOrDate={menu ?? DateTimeUtils.toString(date.current)}
          clipboardMenu={clipboardMenu}
          disabled={disabled}
          onMenuChanged={handleMenuChanged}
        ></AdminMealButtons>
      );
      break;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width: "184px",
        display: "flex",
        flexDirection: "column",
        minHeight: "100px",
        pl: 1,
        pr: 1,
        pb: 1,
      }}
    >
      {buttonBar}
      <Box
        className={"testname"}
        sx={{
          flexGrow: 1,
          backgroundSize: "100px",
          backgroundImage: backgroundImage
            ? 'url("' + backgroundImage + '")'
            : undefined,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {menu ? <MenuPanel disabled={disabled} menu={menu} /> : <></>}
      </Box>
    </Paper>
  );
};

interface MonthlyMealPlanProps {
  month: number;
  expand: boolean;
  clipboardMenu?: Menu;
}

const MonthlyMealPlan: React.FC<MonthlyMealPlanProps> = ({
  month,
  clipboardMenu,
  expand,
}) => {
  let nextSchoolDay = new Date();
  if (nextSchoolDay.getDay() % 6 === 0) {
    nextSchoolDay = new Date(
      DateTimeUtils.addDays(nextSchoolDay, (nextSchoolDay.getDay() + 1) % 5)
    );
  }

  let startDate = new Date(nextSchoolDay);
  if (month !== nextSchoolDay.getMonth()) {
    startDate.setDate(1);
    startDate.setMonth(month);
    startDate.setFullYear(
      startDate.getFullYear() + (startDate.getMonth() < month ? 1 : 0)
    );
  }

  if (startDate.getDay() % 6 === 0) {
    startDate = new Date(
      DateTimeUtils.addDays(startDate, (startDate.getDay() + 1) % 5)
    );
  }

  const title =
    MONTH_NAMES[startDate.getMonth()] + " " + startDate.getFullYear();

  const dates: string[] = [];
  do {
    dates.push(DateTimeUtils.toString(startDate));
    startDate = new Date(
      DateTimeUtils.addDays(
        DateTimeUtils.getFirstDayOfWeek(DateTimeUtils.addDays(startDate, 7)),
        1
      )
    );
  } while (startDate.getMonth() === month);

  return (
    <Accordion defaultExpanded={expand}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        {" "}
        <Typography fontWeight="bold">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            pb: 1,
            pt: 1,
            overflowX: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {dates.map((date) => (
            <WeeklyMealPlan
              key={date}
              clipboardMenu={clipboardMenu}
              date={DateTimeUtils.toDate(date)}
            ></WeeklyMealPlan>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

interface WeeklyMealPlanProps {
  date: Date;
  clipboardMenu?: Menu;
}

const WeeklyMealPlan: React.FC<WeeklyMealPlanProps> = ({
  date,
  clipboardMenu,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { scheduledMenus } = useContext(AppContext);
  const [thisWeeksMenus, setThisWeeksMenus] = useState<
    (DailyMenu | undefined)[]
  >([]);

  const startOfWeek = DateTimeUtils.addDays(
    DateTimeUtils.getFirstDayOfWeek(date),
    1
  );
  const targetMonth = date.getMonth();

  useEffect(() => {
    const menusForWeek = [];
    for (let i = 0; i < 5; i++) {
      const currentDate = DateTimeUtils.addDays(startOfWeek, i);
      if (currentDate.getMonth() !== targetMonth) {
        menusForWeek.push(undefined);
      } else {
        const dateString = DateTimeUtils.toString(currentDate);
        menusForWeek.push(
          scheduledMenus.find((menu) => menu.date === dateString)
        );
      }
    }
    setThisWeeksMenus(menusForWeek);
  }, [scheduledMenus, date]);

  return (
    <Box
      sx={{
        pl: 1,
        pr: 1,
        display: "flex",
        flexDirection: "row",
        gap: 1,
        alignItems: "stretch",
        width: "fit-content",
        justifyContent: "space-between",
        overflowX: "visible",
      }}
    >
      {thisWeeksMenus.map((menu, index) => {
        const thisDate = DateTimeUtils.addDays(startOfWeek, index);
        if (thisDate.getMonth() !== targetMonth) {
          return (
            <Box
              key={DateTimeUtils.toString(thisDate)}
              sx={{ width: "200px" }}
            ></Box>
          );
        }

        return (
          <MealPlan
            key={DateTimeUtils.toString(thisDate)}
            clipboardMenu={clipboardMenu}
            disabled={thisDate < today}
            menuOrDate={menu ?? DateTimeUtils.toString(thisDate)}
          ></MealPlan>
        );
      })}
    </Box>
  );
};

interface MealCalendarProps {
  clipboardMenu?: Menu;
}

const MealCalendar: React.FC<MealCalendarProps> = ({ clipboardMenu }) => {
  const { scheduledMenus, user } = useContext(AppContext);

  const today = new Date();

  let nextSchoolDay = new Date(today);
  nextSchoolDay.setHours(0, 0, 0, 0);
  if (nextSchoolDay.getDay() % 6 === 0) {
    nextSchoolDay = new Date(
      DateTimeUtils.addDays(nextSchoolDay, (nextSchoolDay.getDay() + 1) % 5)
    );
  }

  let targetDate = new Date(nextSchoolDay);
  const months: number[] = [];

  if (user.role === Role.PARENT) {
    const futurePurchasableMeals = scheduledMenus.filter(
      (menu) => DateTimeUtils.toDate(menu.orderEndTime) >= targetDate
    );

    if (!futurePurchasableMeals.length) {
      return <Typography>No meals scheduled for purchase</Typography>;
    }

    const nextPurchasableMealDate = futurePurchasableMeals
      .map((menu) => new Date(menu.orderStartTime))
      .reduce((d1, d2) => (d1 < d2 ? d1 : d2), new Date("2100-01-01"));

    if (targetDate < nextPurchasableMealDate) {
      targetDate = nextPurchasableMealDate;
    }

    do {
      if (
        futurePurchasableMeals.find((meal) => {
          const mealDate = DateTimeUtils.toDate(meal.date);
          return (
            mealDate.getMonth() === targetDate.getMonth() &&
            mealDate.getFullYear() === targetDate.getFullYear()
          );
        })
      ) {
        months.push(targetDate.getMonth());
      }
      targetDate.setDate(1);
      targetDate.setMonth((targetDate.getMonth() + 1) % 12);
      if (targetDate.getMonth() === 0) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }
    } while (targetDate.getMonth() !== today.getMonth());
  } else if (user.role === Role.CAFETERIA || user.role === Role.TEACHER) {
    const futureMealsToBeServed = scheduledMenus.filter(
      (menu) => DateTimeUtils.toDate(menu.date) >= targetDate
    );

    if (!futureMealsToBeServed.length) {
      return <Typography>No meals scheduled to be served</Typography>;
    }

    const nextMealServiceDate = futureMealsToBeServed
      .map((menu) => DateTimeUtils.toDate(menu.date))
      .reduce((d1, d2) => (d1 < d2 ? d1 : d2), new Date("2100-01-01"));

    if (targetDate < nextMealServiceDate) {
      targetDate = nextMealServiceDate;
    }

    do {
      if (
        futureMealsToBeServed.find((meal) => {
          const mealDate = DateTimeUtils.toDate(meal.date);
          return (
            mealDate.getMonth() === targetDate.getMonth() &&
            mealDate.getFullYear() === targetDate.getFullYear()
          );
        })
      ) {
        months.push(targetDate.getMonth());
      }
      targetDate.setDate(1);
      targetDate.setMonth((targetDate.getMonth() + 1) % 12);
      if (targetDate.getMonth() === 0) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }
    } while (targetDate.getMonth() !== today.getMonth());
  } else {
    do {
      months.push(targetDate.getMonth());
      targetDate.setDate(1);
      targetDate.setMonth((targetDate.getMonth() + 1) % 12);
      if (targetDate.getMonth() === 0) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }
    } while (targetDate.getMonth() !== today.getMonth());
  }

  return (
    <Box>
      {months.map((month, index) => (
        <MonthlyMealPlan
          clipboardMenu={clipboardMenu}
          expand={!index}
          key={month}
          month={month}
        />
      ))}
    </Box>
  );
};

export default MealCalendar;
