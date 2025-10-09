import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
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
import { NULL_USER } from "../../models/User";
const KitchenPage: React.FC = () => {
  const { date } = useParams();
  const reportRef = React.useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: reportRef });
  const {
    setInactivityTimeout,
    scheduledMenus,
    user,
    setUser,
    setUsers,
    setMenus,
    setPantryItems: setMenuItems,
    setScheduledMenus,
    setNotifications,
  } = React.useContext(AppContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    localStorage.removeItem("jwtToken");
    setUser(NULL_USER);
    setUsers([]);
    setMenus([]);
    setMenuItems([]);
    setScheduledMenus([]);
    setMenuItems([]);
    setNotifications([]);
    navigate(LOGIN_URL);
  };

  const handleChangePassword = () => {
    handleClose();
    setChangePasswordDialogOpen(true);
  };

  // Get all dates with scheduled menus, sorted
  const scheduledDates = scheduledMenus.map((menu) => menu.date).sort();

  // Find current date index
  const currentDate = date || DateTimeUtils.toString(new Date());
  const currentIndex = scheduledDates.findIndex((date) => date >= currentDate);

  if (!date && currentIndex >= 0) {
    navigate(`${KITCHEN_URL}/${scheduledDates[currentIndex]}`);
  }

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
    setInactivityTimeout(480);
    return () => {
      setInactivityTimeout(30);
    };
  }, []);

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
        <CafeteriaReport
          date={date || DateTimeUtils.toString(new Date())}
          large={true}
        />
      </Box>
      <Box display="none">
        <Box ref={reportRef}>
          <PrintableCafeteriaReport
            date={date || DateTimeUtils.toString(new Date())}
          />
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
        <MenuItem onClick={handleChangePassword}>
          <ListItemIcon>
            <Lock fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Password</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  );
};

export default KitchenPage;
