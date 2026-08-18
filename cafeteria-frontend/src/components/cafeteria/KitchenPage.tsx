import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem as MuiMenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Print,
  ChevronLeft,
  ChevronRight,
  AccountCircle,
  Logout,
} from "@mui/icons-material";

import PrintableCafeteriaReport from "../printing/PrintableCafeteriaReport";
import CafeteriaReport from "./CafeteriaReport";
import { useReactToPrint } from "react-to-print";
import { useParams, useNavigate } from "react-router-dom";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { AppContext } from "../../AppContextProvider";
import { KITCHEN_URL, LOGIN_URL } from "../../MainAppPanel";
import ChangePasswordDialog from "../settings/ChangePasswordDialog";
import { Lock } from "@mui/icons-material";
import { NULL_SCHOOL_USER } from "../../models/SchoolUser";
import { fetchOrdersByMealDate, fetchSessionInfo } from "../../api/CafeteriaClient";
import SessionInfo from "../../models/SessionInfo";
import { NO_SCHOOL_YEAR } from "../../models/SchoolYear";

const KITCHEN_ROLLOVER_HOUR = 1;

const getSchoolDateTimeParts = (date: Date, timeZone?: string) => {
  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
      });
      const parts = formatter.formatToParts(date);
      const get = (type: string) =>
        parts.find((part) => part.type === type)?.value ?? "";
      return {
        dateStr: `${get("year")}-${get("month")}-${get("day")}`,
        hour: parseInt(get("hour"), 10),
      };
    } catch {
      // Fall through to local time if the timezone is invalid
    }
  }

  return {
    dateStr: DateTimeUtils.toString(date),
    hour: date.getHours(),
  };
};

const KitchenPage: React.FC = () => {
  const { date } = useParams();
  const reportRef = React.useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: reportRef });
  const {
    scheduledMenus,
    school,
    user,
    setUser,
    setUsers,
    setStudents,
    setMenus,
    setOrders,
    setPantryItems: setMenuItems,
    setIngredients,
    setUnitsOfMeasure,
    setScheduledMenus,
    setNotifications,
    setCalendarNotes,
    setSchool,
    setSchoolYears,
    setCurrentSchoolYear,
    setSurvey,
    setSnackbarErrorMsg,
  } = React.useContext(AppContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);

  const today = DateTimeUtils.toString(DateTimeUtils.getCurrentDate());
  const scheduledDates = useMemo(
    () => scheduledMenus.map((menu) => menu.date).sort(),
    [scheduledMenus],
  );
  const nextScheduledDate = scheduledDates.find(
    (scheduledDate) => scheduledDate >= today,
  );
  const nextServingDate = nextScheduledDate ?? today;
  const [loadedDate, setLoadedDate] = useState(nextServingDate);
  const lastRolloverDateRef = useRef<string | null>(null);
  const dateRef = useRef(date);
  dateRef.current = date;
  const scheduledMenusRef = useRef(scheduledMenus);
  scheduledMenusRef.current = scheduledMenus;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    localStorage.removeItem("jwtToken");
    setUser(NULL_SCHOOL_USER);
    setUsers([]);
    setMenus([]);
    setMenuItems([]);
    setScheduledMenus([]);
    setOrders([]);
    setNotifications([]);
    navigate(LOGIN_URL);
  };

  const handleChangePassword = () => {
    handleClose();
    setChangePasswordDialogOpen(true);
  };

  const currentDate = date || today;
  const currentIndex = scheduledDates.findIndex(
    (scheduledDate) => scheduledDate >= currentDate,
  );

  useEffect(() => {
    if (!date && nextScheduledDate) {
      navigate(`${KITCHEN_URL}/${nextScheduledDate}`, { replace: true });
    }
  }, [date, nextScheduledDate, navigate]);

  useEffect(() => {
    if (!date && nextScheduledDate) {
      return;
    }

    const targetDate = date ?? today;
    if (targetDate === loadedDate) {
      return;
    }

    let cancelled = false;
    fetchOrdersByMealDate(targetDate)
      .then((dayOrders) => {
        if (!cancelled) {
          setOrders(dayOrders);
          setLoadedDate(targetDate);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnackbarErrorMsg("Unable to load meals for this date.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    date,
    today,
    loadedDate,
    nextScheduledDate,
    setOrders,
    setSnackbarErrorMsg,
  ]);

  // Get previous and next dates
  const previousDate =
    currentIndex > 0 ? scheduledDates[currentIndex - 1] : null;
  const nextDate =
    currentIndex < scheduledDates.length - 1
      ? scheduledDates[currentIndex + 1]
      : null;

  const handlePreviousDate = () => {
    if (previousDate) {
      navigate(`${KITCHEN_URL}/${previousDate}`);
    }
  };

  const handleNextDate = () => {
    if (nextDate) {
      navigate(`${KITCHEN_URL}/${nextDate}`);
    }
  };

  useEffect(() => {
    const applySession = (sessionInfo: SessionInfo) => {
      sessionInfo.students.sort((s1, s2) => {
        const s1Name = s1.firstName + " " + s1.lastName;
        const s2Name = s2.firstName + " " + s2.lastName;
        return s1Name.toLowerCase().localeCompare(s2Name.toLowerCase());
      });
      setUser(sessionInfo.user);
      setUsers(sessionInfo.users);
      setStudents(sessionInfo.students);
      setMenus(sessionInfo.menus);
      setScheduledMenus(sessionInfo.scheduledMenus);
      setNotifications(sessionInfo.notifications);
      setCalendarNotes(sessionInfo.calendarNotes ?? []);
      setMenuItems(sessionInfo.pantryItems);
      setIngredients(sessionInfo.ingredients);
      setUnitsOfMeasure(sessionInfo.unitsOfMeasure);
      setSchool(sessionInfo.school);
      setSchoolYears(sessionInfo.schoolYears);
      setCurrentSchoolYear(
        sessionInfo.schoolYears.find((sy) => sy.isCurrent) ?? NO_SCHOOL_YEAR,
      );
      setSurvey(sessionInfo.survey);
    };

    const advanceToNextServingDay = async () => {
      const { dateStr, hour } = getSchoolDateTimeParts(
        DateTimeUtils.getCurrentDate(),
        school.timezone,
      );
      if (hour < KITCHEN_ROLLOVER_HOUR) {
        return;
      }
      if (lastRolloverDateRef.current === dateStr) {
        return;
      }

      const shouldRefreshSession = lastRolloverDateRef.current !== null;
      const previousRolloverDate = lastRolloverDateRef.current;
      lastRolloverDateRef.current = dateStr;

      let menus = scheduledMenusRef.current;
      if (shouldRefreshSession) {
        try {
          const sessionInfo = await fetchSessionInfo();
          applySession(sessionInfo);
          menus = sessionInfo.scheduledMenus;
          const nextServing = menus
            .map((menu) => menu.date)
            .sort()
            .find((scheduledDate) => scheduledDate >= dateStr);
          setOrders(sessionInfo.orders);
          if (nextServing) {
            setLoadedDate(nextServing);
            if (nextServing !== dateRef.current) {
              navigate(`${KITCHEN_URL}/${nextServing}`, { replace: true });
            }
          }
        } catch {
          lastRolloverDateRef.current = previousRolloverDate;
          setSnackbarErrorMsg("Unable to refresh kitchen data.");
        }
        return;
      }

      const nextServing = menus
        .map((menu) => menu.date)
        .sort()
        .find((scheduledDate) => scheduledDate >= dateStr);
      if (nextServing && nextServing !== dateRef.current) {
        navigate(`${KITCHEN_URL}/${nextServing}`, { replace: true });
      }
    };

    advanceToNextServingDay();
    const intervalId = window.setInterval(advanceToNextServingDay, 60 * 1000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        advanceToNextServingDay();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [
    school.timezone,
    navigate,
    setUser,
    setUsers,
    setStudents,
    setMenus,
    setScheduledMenus,
    setNotifications,
    setCalendarNotes,
    setMenuItems,
    setIngredients,
    setUnitsOfMeasure,
    setSchool,
    setSchoolYears,
    setCurrentSchoolYear,
    setSurvey,
    setOrders,
    setSnackbarErrorMsg,
  ]);

  return (
    <Stack sx={{ height: "100%" }}>
      <Stack pl={2} pr={2} direction="row" alignItems="center">
        <Stack
          flexGrow={1}
          pl={2}
          pr={2}
          direction="row"
          gap={4}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            onClick={handlePreviousDate}
            disabled={!previousDate}
            variant="outlined"
            startIcon={<ChevronLeft />}
          >
            {previousDate
              ? DateTimeUtils.toString(
                  previousDate,
                  DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
                )
              : "No other meals"}
          </Button>
          <Typography fontWeight="bold" fontSize={32} variant="h6">
            {DateTimeUtils.toString(
              currentDate,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            )}
          </Typography>
          <Button
            onClick={handleNextDate}
            disabled={!nextDate}
            variant="outlined"
            endIcon={<ChevronRight />}
          >
            {nextDate
              ? DateTimeUtils.toString(
                  nextDate,
                  DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
                )
              : "No meals being served"}
          </Button>
        </Stack>
        <Stack direction="row">
          <IconButton
            onClick={() => reactToPrintFn()}
            size="large"
            color="primary"
          >
            <Print />
          </IconButton>
          <Tooltip title={user.userName}>
            <IconButton onClick={handleClick} size="large" color="primary">
              <AccountCircle />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Divider />
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {loadedDate === currentDate ? (
          <CafeteriaReport date={currentDate} large={true} />
        ) : null}
      </Box>
      <Box display="none">
        <Box ref={reportRef}>
          {loadedDate === currentDate ? (
            <PrintableCafeteriaReport date={currentDate} />
          ) : null}
        </Box>
      </Box>
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <ListSubheader sx={{ lineHeight: 1.5 }}>{user.userName}</ListSubheader>
        <MuiMenuItem onClick={handleChangePassword}>
          <ListItemIcon>
            <Lock fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Password</ListItemText>
        </MuiMenuItem>
        <MuiMenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MuiMenuItem>
      </Menu>
    </Stack>
  );
};

export default KitchenPage;
