import React from "react";
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
  Divider,
  ListSubheader,
} from "@mui/material";
import {
  DateTimeFormat,
  DateTimeUtils,
  MONTH_NAMES,
  SHORT_MONTH_NAMES,
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
import OrderMealDialog from "../shoppingcart/OrderMealDialog";
import { Role } from "../../models/User";
import CafeteriaDialog from "../cafeteria/CafeteriaDialog";
import MealReportDialog from "../meals/MealReportDialog";
import { AxiosError } from "axios";
import OrderDatesDialog from "./OrderDatesDialog";
import DonateMealDialog from "../shoppingcart/DonateMealDialog";

interface MealPlanProps {
  menuOrDate: DailyMenu | string;
  clipboardMenu?: Menu;
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

const DAILY_BACKGROUND_IMAGES = [
  "/s.png",
  "/m.png",
  "/t.png",
  "/w.png",
  "/t.png",
  "/f.png",
  "/s.png",
];
const AdminMealButtons: React.FC<AdminMealButtonProps> = ({
  menuOrDate,
  clipboardMenu,
  onMenuChanged,
}) => {
  const {
    user,
    scheduledMenus,
    setScheduledMenus,
    school,
    orders,
    setSnackbarErrorMsg,
    shoppingCart,
    currentSchoolYear,
  } = useContext(AppContext);
  const [menu, setMenu] = useState(
    typeof menuOrDate === "string" ? undefined : (menuOrDate as DailyMenu)
  );
  const [editAvail, setEditAvail] = useState(false);
  const [editMenu, setEditMenu] = useState(false);
  const [showCafeteriaReport, setShowCafeteriaReport] = useState(false);
  const [showClassroomReport, setShowClassroomReport] = useState(false);
  const [showDonateMeal, setShowDonateMeal] = useState(false);
  const [addToCart, setAddToCart] = useState(false);
  const [showOrderedMeals, setShowOrderedMeals] = useState(false);
  const [hasMealsInCart, setHasMealsInCart] = useState(
    shoppingCart.items.find((item) => item.dailyMenuId === menu?.id)
      ? true
      : false
  );

  const dateStr = menu?.date ?? (menuOrDate as string);
  const today = DateTimeUtils.toString(new Date());
  const date = DateTimeUtils.toDate(dateStr);

  const isDateInUpcomingSchoolYear =
    dateStr <= currentSchoolYear.endDate &&
    dateStr >= today &&
    (currentSchoolYear.id ? true : false);

  const isDateInCurrentSchoolYear =
    isDateInUpcomingSchoolYear && dateStr >= currentSchoolYear.startDate;

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
      school.orderStartPeriodCount,
      school.orderStartPeriodType,
      school.orderStartRelativeTo,
      school.orderStartTime
    );
  };

  const calculateOrderEndTime = (mealDate: Date) => {
    return calculateOrderTime(
      mealDate,
      school.orderEndPeriodCount,
      school.orderEndPeriodType,
      school.orderEndRelativeTo,
      school.orderEndTime
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

  const handleAddToCart = () => {
    setPulldownMenuAnchor(null);
    setAddToCart(true);
  };

  const handleShowOrderedMeals = () => {
    setPulldownMenuAnchor(null);
    setShowOrderedMeals(true);
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

  const handleShowDonateMeal = () => {
    setPulldownMenuAnchor(null);
    setShowDonateMeal(true);
  };

  const handleMealAddedToCart = () => {
    setAddToCart(false);
    setHasMealsInCart(true);
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
        {SHORT_MONTH_NAMES[DateTimeUtils.toDate(date).getMonth()] +
          " " +
          DateTimeUtils.toDate(date).getDate()}
      </Typography>

      {!menu || today > dateStr ? (
        <IconButton color="primary" disabled={true} size="small">
          <AccessTime />
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
        disabled={!isDateInCurrentSchoolYear || !clipboardMenu}
        onClick={handlePasteMenu}
        size="small"
      >
        <ContentPasteGo />
      </IconButton>
      <IconButton
        color="primary"
        disabled={!menu}
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
            Adminstrator&apos;s Report
          </MenuItem>
          <MenuItem
            disabled={!hasOrderedMeals}
            onClick={handleShowCafeteriaReport}
          >
            Cafeteria Report
          </MenuItem>
          <MenuItem disabled={today > dateStr} onClick={handleShowDonateMeal}>
            Order Student Meal
          </MenuItem>
          <MenuItem disabled={today > dateStr} onClick={handleDeleteClicked}>
            Delete
          </MenuItem>
          <Divider />
          <ListSubheader>For My Family</ListSubheader>
          <MenuItem disabled={today > dateStr} onClick={handleAddToCart}>
            Order A Meal
          </MenuItem>
          <MenuItem
            disabled={!hasOrderedMeals && !hasMealsInCart}
            onClick={handleShowOrderedMeals}
          >
            Show Ordered Meals
          </MenuItem>
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
        <MealReportDialog
          date={menu!.date}
          onClose={() => setShowClassroomReport(false)}
        />
      ) : (
        <></>
      )}
      {showDonateMeal && menu ? (
        <DonateMealDialog
          menu={menu}
          onClose={() => setShowDonateMeal(false)}
        />
      ) : (
        <></>
      )}
      {addToCart ? (
        <OrderMealDialog
          user={user}
          onClose={() => setAddToCart(false)}
          onAddedToCart={handleMealAddedToCart}
          date={menu!.date}
        />
      ) : (
        <></>
      )}
      {showOrderedMeals ? (
        <DailyMealsDialog
          user={user}
          onClose={() => setShowOrderedMeals(false)}
          date={menu!.date}
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
  const { orders, students, user, currentSchoolYear, shoppingCart } =
    useContext(AppContext);
  const [showReport, setShowReport] = useState(false);
  const [addToCart, setAddToCart] = useState(false);
  const [showOrderedMeals, setShowOrderedMeals] = useState(false);
  const [hasMealsInCart, setHasMealsInCart] = useState(
    shoppingCart.items.find((item) => item.dailyMenuId === menu?.id)
      ? true
      : false
  );
  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);

  const handleMealAddedToCart = () => {
    setAddToCart(false);
    setHasMealsInCart(true);
  };

  const handleCloseMenu = () => {
    setPulldownMenuAnchor(null);
  };

  const handleShowMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPulldownMenuAnchor(event.currentTarget);
  };

  const handleShowAddToCart = () => {
    setPulldownMenuAnchor(null);
    setAddToCart(true);
  };

  const handleShowOrderedMeals = () => {
    setPulldownMenuAnchor(null);
    setShowOrderedMeals(true);
  };

  const menu =
    typeof menuOrDate === "string" ? undefined : (menuOrDate as DailyMenu);
  const date = menu?.date ?? (menuOrDate as string);

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const today = DateTimeUtils.toString(new Date());

  const studentIds = students
    .filter((student) =>
      currentSchoolYear.studentLunchTimes.find(
        (lt) =>
          lt.studentId === student.id &&
          lt.dayOfWeek === dayOfWeek &&
          lt.teacherId == user.id
      )
        ? true
        : false
    )
    .map((student) => student.id);

  const childrenIds = students
    .filter((s) => s.parents.includes(user.id))
    .map((student) => student.id);

  const studentsHaveOrderedMeals = orders
    .flatMap((order) => order.meals)
    .find(
      (meal) =>
        meal.date === date &&
        (!meal.studentId || studentIds.includes(meal.studentId))
    )
    ? true
    : false;

  const childrenHaveOrderedMeals = orders
    .flatMap((order) => order.meals)
    .find(
      (meal) =>
        meal.date === date &&
        (!meal.studentId || childrenIds.includes(meal.studentId))
    )
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
        {SHORT_MONTH_NAMES[DateTimeUtils.toDate(date).getMonth()] +
          " " +
          DateTimeUtils.toDate(date).getDate()}
      </Typography>
      <IconButton
        color="primary"
        disabled={!menu || !studentsHaveOrderedMeals}
        onClick={() => setShowReport(true)}
        size="small"
      >
        <ManageSearch />
      </IconButton>
      <IconButton
        color="primary"
        disabled={!menu}
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
          <MenuItem
            disabled={!menu || !isAcceptingOrders(menu) || today > date}
            onClick={handleShowAddToCart}
          >
            Order Meal
          </MenuItem>
          <MenuItem
            disabled={!childrenHaveOrderedMeals && !hasMealsInCart}
            onClick={handleShowOrderedMeals}
          >
            Show My Orders
          </MenuItem>
        </PulldownMenu>
      )}

      {showOrderedMeals ? (
        <DailyMealsDialog
          user={user}
          onClose={() => setShowOrderedMeals(false)}
          date={date}
        />
      ) : (
        <></>
      )}
      {addToCart ? (
        <OrderMealDialog
          user={user}
          onClose={() => setAddToCart(false)}
          onAddedToCart={handleMealAddedToCart}
          date={date}
        />
      ) : (
        <></>
      )}
      {showReport ? (
        <MealReportDialog
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
        {SHORT_MONTH_NAMES[DateTimeUtils.toDate(date).getMonth()] +
          " " +
          DateTimeUtils.toDate(date).getDate()}
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
  const { orders, shoppingCart, user } =
    useContext(AppContext);

  const menu =
    typeof menuOrDate === "string" ? undefined : (menuOrDate as DailyMenu);
  const date = menu?.date ?? (menuOrDate as string);

  const [showOrderedMeals, setShowOrderedMeals] = useState(false);
  const [addToCart, setAddToCart] = useState(false);
  const [showOrderDates, setShowOrderDates] = useState(false);
  const [hasMealsInCart, setHasMealsInCart] = useState(
    shoppingCart.items.find((item) => item.dailyMenuId === menu?.id)
      ? true
      : false
  );

  const today = DateTimeUtils.toString(new Date());
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
        {SHORT_MONTH_NAMES[DateTimeUtils.toDate(date).getMonth()] +
          " " +
          DateTimeUtils.toDate(date).getDate()}
      </Typography>
      <IconButton
        color="primary"
        disabled={(!hasOrderedMeals && !hasMealsInCart) || !menu}
        onClick={() => setShowOrderedMeals(true)}
        size="small"
      >
        <ManageSearch />
      </IconButton>
      <IconButton
        color={
          today <= date && !currentlyAcceptingOrders && willAcceptOrderInFuture
            ? "warning"
            : "primary"
        }
        disabled={today > date || !currentlyAcceptingOrders && !willAcceptOrderInFuture}
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
          user={user}
          onClose={() => setShowOrderedMeals(false)}
          date={date}
        />
      ) : (
        <></>
      )}
      {addToCart ? (
        <OrderMealDialog
          user={user}
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

const MealPlan: React.FC<MealPlanProps> = ({ menuOrDate, clipboardMenu }) => {
  const { user, currentSchoolYear } = useContext(AppContext);
  const [menu, setMenu] = useState(
    typeof menuOrDate === "string" ? undefined : (menuOrDate as DailyMenu)
  );

  const today = DateTimeUtils.toString(new Date());
  const date = menu?.date ?? (menuOrDate as string);

  const backgroundImage = "/m.png";
  const handleMenuChanged = (menu?: DailyMenu) => {
    setMenu(menu);
  };

  const isDateInCurrentSchoolYear =
    date <= currentSchoolYear.endDate &&
    (currentSchoolYear.id ? true : false) &&
    date >= currentSchoolYear.startDate;

  let buttonBar = (
    <CafeteriaMealButtons
      menuOrDate={menu && isDateInCurrentSchoolYear ? menu : date}
    ></CafeteriaMealButtons>
  );
  switch (user.role) {
    case Role.TEACHER:
      buttonBar = (
        <TeacherMealButtons
          menuOrDate={menu && isDateInCurrentSchoolYear ? menu : date}
        ></TeacherMealButtons>
      );
      break;
    case Role.PARENT:
      buttonBar = (
        <ParentMealButtons
          menuOrDate={menu && isDateInCurrentSchoolYear ? menu : date}
        ></ParentMealButtons>
      );
      break;
    case Role.ADMIN:
      buttonBar = (
        <AdminMealButtons
          menuOrDate={menu && isDateInCurrentSchoolYear ? menu : date}
          clipboardMenu={clipboardMenu}
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
          backgroundSize: "65px 65px",
          backgroundImage: backgroundImage
            ? 'url("' +
              DAILY_BACKGROUND_IMAGES[DateTimeUtils.toDate(date).getDay()] +
              '")'
            : undefined,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {menu && isDateInCurrentSchoolYear ? (
          <MenuPanel disabled={today > menu.date} menu={menu} />
        ) : (
          <></>
        )}
      </Box>
    </Paper>
  );
};

interface MonthlyMealPlanProps {
  startOfMonth: Date;
  expand: boolean;
  clipboardMenu?: Menu;
  disabled?: boolean;
}

const MonthlyMealPlan: React.FC<MonthlyMealPlanProps> = ({
  startOfMonth,
  clipboardMenu,
  expand,
}) => {
  const title =
    MONTH_NAMES[startOfMonth.getMonth()] + " " + startOfMonth.getFullYear();

  const dates: Date[] = [];

  const firstWeekdayOfMonth = new Date(startOfMonth);
  while (
    firstWeekdayOfMonth.getDay() === 0 ||
    firstWeekdayOfMonth.getDay() === 6
  ) {
    firstWeekdayOfMonth.setDate(firstWeekdayOfMonth.getDate() + 1);
  }
  firstWeekdayOfMonth.setHours(0, 0, 0, 0);

  const lastWeekdayOfMonth = new Date(
    startOfMonth.getFullYear(),
    startOfMonth.getMonth() + 1,
    0
  );
  while (
    lastWeekdayOfMonth.getDay() === 0 ||
    lastWeekdayOfMonth.getDay() === 6
  ) {
    lastWeekdayOfMonth.setDate(lastWeekdayOfMonth.getDate() - 1);
  }
  lastWeekdayOfMonth.setHours(23, 59, 59, 999);

  dates.push(new Date(firstWeekdayOfMonth));
  const nextMonday = DateTimeUtils.addDays(
    DateTimeUtils.getFirstDayOfWeek(firstWeekdayOfMonth),
    8
  );
  while (nextMonday.getMonth() === startOfMonth.getMonth()) {
    dates.push(new Date(nextMonday));
    nextMonday.setDate(nextMonday.getDate() + 7);
  }

  const nextSchoolDay = new Date();
  while (nextSchoolDay.getDay() === 0 || nextSchoolDay.getDay() === 6) {
    nextSchoolDay.setDate(nextSchoolDay.getDate() + 1);
  }
  nextSchoolDay.setHours(0, 0, 0, 0);

  if (
    nextSchoolDay >= firstWeekdayOfMonth &&
    nextSchoolDay <= lastWeekdayOfMonth
  ) {
    dates.splice(
      0,
      dates.findIndex((date) => date > nextSchoolDay)
    );
    dates.unshift(new Date(nextSchoolDay));
  }

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
              key={DateTimeUtils.toString(date)}
              clipboardMenu={clipboardMenu}
              date={date}
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
  const { currentSchoolYear } = useContext(AppContext);

  const firstDayOfSchoolYear = new Date(currentSchoolYear.startDate);
  while (
    firstDayOfSchoolYear.getDay() === 0 ||
    firstDayOfSchoolYear.getDay() === 6
  ) {
    firstDayOfSchoolYear.setDate(firstDayOfSchoolYear.getDate() + 1);
  }
  firstDayOfSchoolYear.setHours(0, 0, 0, 0);

  const lastDayOfSchoolYear = new Date(currentSchoolYear.endDate);
  while (
    lastDayOfSchoolYear.getDay() === 0 ||
    lastDayOfSchoolYear.getDay() === 6
  ) {
    lastDayOfSchoolYear.setDate(lastDayOfSchoolYear.getDate() - 1);
  }
  lastDayOfSchoolYear.setHours(23, 59, 59, 999); // Set to end of day

  const nextSchoolDay = new Date();
  while (nextSchoolDay.getDay() === 0 || nextSchoolDay.getDay() === 6) {
    nextSchoolDay.setDate(nextSchoolDay.getDate() + 1);
  }
  nextSchoolDay.setHours(0, 0, 0, 0);

  let schoolDay = new Date(nextSchoolDay);
  if (nextSchoolDay > lastDayOfSchoolYear) {
    schoolDay = new Date(lastDayOfSchoolYear);
  } else if (nextSchoolDay < firstDayOfSchoolYear) {
    schoolDay = new Date(firstDayOfSchoolYear);
  }
  schoolDay.setDate(1);

  const dates: Date[] = [];
  while (schoolDay <= lastDayOfSchoolYear) {
    dates.push(schoolDay);
    schoolDay = new Date(schoolDay);
    schoolDay.setMonth((schoolDay.getMonth() + 1) % 12);
    if (schoolDay.getMonth() === 0) {
      schoolDay.setFullYear(schoolDay.getFullYear() + 1);
    }
  }

  return (
    <Box>
      {dates.map((date, index) => (
        <MonthlyMealPlan
          clipboardMenu={clipboardMenu}
          expand={!index}
          key={DateTimeUtils.toString(date)}
          startOfMonth={date}
        />
      ))}
    </Box>
  );
};

export default MealCalendar;
