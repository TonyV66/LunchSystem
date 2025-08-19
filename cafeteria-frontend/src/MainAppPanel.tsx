import * as React from "react";
import Box from "@mui/material/Box";
import {
  Divider,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  ListSubheader,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";

import {
  Navigate,
  Outlet,
  matchRoutes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppContext } from "./AppContextProvider";
import {
  CalendarMonth,
  EventRepeat,
  Fastfood,
  Logout,
  People,
  ReceiptLong,
  Settings,
  ShoppingCart,
  SpeakerNotes,
  Lock,
  AccountCircle,
} from "@mui/icons-material";
import User, { NULL_USER, Role } from "./models/User";
import { grey, red } from "@mui/material/colors";
import { DateTimeUtils } from "./DateTimeUtils";
import ChangePasswordDialog from "./components/settings/ChangePasswordDialog";

const ALT_COLOR = "#ffffff";

export const REGISTRATION_URL = "/register";
export const INVITE_URL = "/invite";
export const ACCOUNT_URL = "/account";
export const USERS_URL = "/users";
export const YEARS_URL = "/years";
export const YEAR_URL = "/year";
export const MEALS_URL = "/meals";
export const LOGIN_URL = "/login";
export const CART_URL = "/cart";
export const CALENDAR_URL = "/calendar";
export const ORDERS_URL = "/orders";
export const STUDENTS_URL = "/students";
export const CLASSROOM_URL = "/classroom";
export const FAMILY_URL = "/family";
export const SCHOOL_YEARS_URL = "/years";
export const SCHOOL_YEAR_URL = "/year";

export const NOTIFICATIONS_URL = "/notifications";

export enum SidebarSelection {
  ACCOUNT = "Account",
  MEALS = "Meals",
  ORDERS = "Orders",
  USERS = "Users",
  CART = "Cart",
  CALENDAR = "Calendar",
  LOGOUT = "Logout",
  NOTIFICATIONS = "Notifications",
  YEARS = "Years",
}

const primaryColor = "primary.dark";

interface SidebarProps {
  onLogout: () => void;
}

interface LogoutButtonProps {
  onLogout: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user } = useContext(AppContext);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  const handleChangePassword = () => {
    handleClose();
    setChangePasswordDialogOpen(true);
  };

  return (
    <>
      <Box onClick={handleClick}>
        <Tooltip title={user.userName}>
          <AccountCircle
            sx={{ cursor: "pointer", p: 1, color: "#ffffff" }}
            fontSize="large"
          />
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
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
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
      />
    </>
  );
};

interface SidebarButtonProps {
  onClick: (selection: SidebarSelection) => void;
  isSelected: boolean;
  showWarning?: boolean;
}

interface UsersButtonProps extends SidebarButtonProps {
  role: Role;
}

const OrderedMealsSidebarButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  return (
    <Tooltip title="My Upcoming Meals">
      <Fastfood
        onClick={() => onClick(SidebarSelection.MEALS)}
        sx={{
          cursor: !isSelected ? "pointer" : undefined,
          p: 1,
          backgroundColor: isSelected ? ALT_COLOR : undefined,
          color: isSelected ? primaryColor : ALT_COLOR,
        }}
        fontSize="large"
      />
    </Tooltip>
  );
};

const CalendarButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  return (
    <Tooltip title="Meal Calendar">
      <CalendarMonth
        onClick={() => onClick(SidebarSelection.CALENDAR)}
        sx={{
          cursor: !isSelected ? "pointer" : undefined,
          p: 1,
          backgroundColor: isSelected ? ALT_COLOR : undefined,
          color: isSelected ? primaryColor : ALT_COLOR,
        }}
        fontSize="large"
      />
    </Tooltip>
  );
};

const NotificationsButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
  showWarning,
}) => {
  return (
    <Tooltip title="Notifications">
      <SpeakerNotes
        onClick={() => onClick(SidebarSelection.NOTIFICATIONS)}
        sx={{
          cursor: !isSelected ? "pointer" : undefined,
          p: 1,
          backgroundColor: isSelected ? ALT_COLOR : undefined,
          color: isSelected ? primaryColor : showWarning ? red[200] : ALT_COLOR,
        }}
        fontSize="large"
      />
    </Tooltip>
  );
};

const UsersButton: React.FC<UsersButtonProps> = ({ onClick, isSelected, role }) => {
  let title = "My Family";
  if (role === Role.TEACHER) {
    title = "My Classroom & Family";
  } else if (role === Role.CAFETERIA) {
    title = "Students";
  } else if (role === Role.ADMIN) {
    title = "Users & Students";
  }
  return (
    <Tooltip title={title}>
      <People
        onClick={() => onClick(SidebarSelection.USERS)}
        sx={{
          cursor: !isSelected ? "pointer" : undefined,
          p: 1,
          backgroundColor: isSelected ? ALT_COLOR : undefined,
          color: isSelected ? primaryColor : ALT_COLOR,
        }}
        fontSize="large"
      />
    </Tooltip>
  );
};

const SchoolYearsButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  return (
    <Tooltip title="School Year Settings">
      <EventRepeat
        onClick={() => onClick(SidebarSelection.YEARS)}
        sx={{
          cursor: !isSelected ? "pointer" : undefined,
          p: 1,
          backgroundColor: isSelected ? ALT_COLOR : undefined,
          color: isSelected ? primaryColor : ALT_COLOR,
        }}
        fontSize="large"
      />
    </Tooltip>
  );
};

const SettingsButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  return (
    <Tooltip title="School Settings">
      <Settings
        onClick={() => onClick(SidebarSelection.ACCOUNT)}
        sx={{
          cursor: !isSelected ? "pointer" : undefined,
          p: 1,
          backgroundColor: isSelected ? ALT_COLOR : undefined,
          color: isSelected ? primaryColor : ALT_COLOR,
        }}
        fontSize="large"
      />
    </Tooltip>
  );
};

const OrdersButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  return (
    <Tooltip title="Order History">
      <ReceiptLong
        onClick={() => onClick(SidebarSelection.ORDERS)}
        sx={{
          cursor: !isSelected ? "pointer" : undefined,
          p: 1,
          backgroundColor: isSelected ? ALT_COLOR : undefined,
          color: isSelected ? primaryColor : ALT_COLOR,
        }}
        fontSize="large"
      />
    </Tooltip>
  );
};

const ShoppingCartButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  const { shoppingCart } = useContext(AppContext);

  const [numItemsInCart, setNumItemsInCart] = useState(0);

  useEffect(() => {
    setNumItemsInCart(shoppingCart.items.length);
  }, [shoppingCart]);

  return (
    <Box position="relative">
      <Typography
        position="absolute"
        fontWeight="bold"
        variant="caption"
        onClick={() => onClick(SidebarSelection.CART)}
        sx={{
          top: 12,
          left: numItemsInCart < 10 ? 22 : 20,
          color: isSelected ? ALT_COLOR : primaryColor,
          cursor: !isSelected ? "pointer" : undefined,
        }}
      >
        {numItemsInCart ? numItemsInCart.toString() : ""}
      </Typography>
      <Tooltip title="Shopping Cart">
        <ShoppingCart
          onClick={
            !numItemsInCart ? undefined : () => onClick(SidebarSelection.CART)
          }
          sx={{
            cursor: numItemsInCart && !isSelected ? "pointer" : undefined,
            p: 1,
            backgroundColor: isSelected ? ALT_COLOR : undefined,
            color: !numItemsInCart
              ? "lightslategrey"
              : isSelected
              ? primaryColor
              : ALT_COLOR,
          }}
          fontSize="large"
        />
      </Tooltip>
    </Box>
  );
};

const getSidebarSelection = (path: string) => {
  if (matchRoutes([{ path: ACCOUNT_URL }], path)) {
    return SidebarSelection.ACCOUNT;
  } else if (matchRoutes([{ path: MEALS_URL }], path)) {
    return SidebarSelection.MEALS;
  } else if (
    matchRoutes(
      [
        { path: USERS_URL },
        { path: STUDENTS_URL },
        { path: CLASSROOM_URL },
        { path: FAMILY_URL },
      ],
      path
    )
  ) {
    return SidebarSelection.USERS;
  } else if (
    matchRoutes([{ path: YEARS_URL }, { path: YEAR_URL + "/*" }], path)
  ) {
    return SidebarSelection.YEARS;
  } else if (matchRoutes([{ path: CART_URL }], path)) {
    return SidebarSelection.CART;
  } else if (matchRoutes([{ path: CALENDAR_URL }], path)) {
    return SidebarSelection.CALENDAR;
  } else if (matchRoutes([{ path: ORDERS_URL }], path)) {
    return SidebarSelection.ORDERS;
  } else if (matchRoutes([{ path: NOTIFICATIONS_URL }], path)) {
    return SidebarSelection.NOTIFICATIONS;
  }
};

const getDefaultUsersUrl = (user: User) => {
  if (user.role === Role.ADMIN) {
    return USERS_URL;
  } else if (user.role === Role.TEACHER) {
    return CLASSROOM_URL;
  } else if (user.role === Role.CAFETERIA) {
    return STUDENTS_URL;
  }
  return FAMILY_URL;
};

const AdminSidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { user } = useContext(AppContext);
  const [selection, setSelection] = useState<SidebarSelection>();
  const location = useLocation();

  useEffect(() => {
    const selection = getSidebarSelection(location.pathname);
    if (selection) {
      setSelection(selection);
    }
  }, [location]);

  const navigate = useNavigate();

  return (
    <Box
      className="sidebar"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pt: 1,
        pb: 1,
        backgroundColor: primaryColor,
        borderStyle: "solid",
        borderRightWidth: 1,
        borderColor: primaryColor,
      }}
    >
      <CalendarButton
        onClick={() => navigate(CALENDAR_URL)}
        isSelected={selection === SidebarSelection.CALENDAR}
      />
      <OrdersButton
        onClick={() => navigate(ORDERS_URL)}
        isSelected={selection === SidebarSelection.ORDERS}
      />
      <UsersButton
        role={Role.ADMIN}
        onClick={() => navigate(getDefaultUsersUrl(user))}
        isSelected={selection === SidebarSelection.USERS}
      />
      <NotificationsButton
        onClick={() => navigate(NOTIFICATIONS_URL)}
        isSelected={selection === SidebarSelection.NOTIFICATIONS}
      />
      <SchoolYearsButton
        onClick={() => navigate(SCHOOL_YEARS_URL)}
        isSelected={selection === SidebarSelection.YEARS}
      />
      <SettingsButton
        onClick={() => navigate(ACCOUNT_URL)}
        isSelected={selection === SidebarSelection.ACCOUNT}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <OrderedMealsSidebarButton
        onClick={() => navigate(MEALS_URL)}
        isSelected={selection === SidebarSelection.MEALS}
      />
      <ShoppingCartButton
        onClick={() => navigate(CART_URL)}
        isSelected={selection === SidebarSelection.CART}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <LogoutButton onLogout={onLogout} />
    </Box>
  );
};

const ParentSidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [selection, setSelection] = useState<SidebarSelection>();
  const location = useLocation();

  const { user, notifications } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    const selection = getSidebarSelection(location.pathname);
    if (selection) {
      setSelection(selection);
    }
  }, [location]);

  useEffect(() => {
    const now = new Date();
    const nowStr = DateTimeUtils.toString(now);
    const unreadNotifications = notifications.filter((notification) => {
      const isUnread =
        new Date(notification.creationDate).getTime() >
          new Date(user.notificationReviewDate).getTime() &&
        notification.startDate <= nowStr &&
        notification.endDate >= nowStr;
      if (isUnread) {
        console.log("found unread");
      }
      return isUnread;
    });
    setHasUnreadNotifications(
      selection != SidebarSelection.NOTIFICATIONS && unreadNotifications.length
        ? true
        : false
    );
  }, []);

  useEffect(() => {
    if (selection === SidebarSelection.NOTIFICATIONS) {
      setHasUnreadNotifications(false);
    }
  });

  return (
    <Box
      className="sidebar"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pt: 1,
        pb: 1,
        backgroundColor: primaryColor,
        borderStyle: "solid",
        borderRightWidth: 1,
        borderColor: primaryColor,
      }}
    >
      <OrderedMealsSidebarButton
        onClick={() => navigate(MEALS_URL)}
        isSelected={selection === SidebarSelection.MEALS}
      />
      <CalendarButton
        onClick={() => navigate(CALENDAR_URL)}
        isSelected={selection === SidebarSelection.CALENDAR}
      />
      <ShoppingCartButton
        onClick={() => navigate(CART_URL)}
        isSelected={selection === SidebarSelection.CART}
      />
      <OrdersButton
        onClick={() => navigate(ORDERS_URL)}
        isSelected={selection === SidebarSelection.ORDERS}
      />
      <UsersButton
        role={Role.PARENT}
        onClick={() => navigate(getDefaultUsersUrl(user))}
        isSelected={selection === SidebarSelection.USERS}
      />
      <NotificationsButton
        onClick={() => navigate(NOTIFICATIONS_URL)}
        isSelected={selection === SidebarSelection.NOTIFICATIONS}
        showWarning={hasUnreadNotifications}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <LogoutButton onLogout={onLogout} />
    </Box>
  );
};

const CafeteriaSidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [selection, setSelection] = useState<SidebarSelection>();
  const location = useLocation();

  const { user, notifications } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    const selection = getSidebarSelection(location.pathname);
    if (selection) {
      setSelection(selection);
    }
  }, [location]);

  useEffect(() => {
    const now = new Date();
    const nowStr = DateTimeUtils.toString(now);
    setHasUnreadNotifications(
      selection != SidebarSelection.NOTIFICATIONS &&
        notifications.filter(
          (notification) =>
            new Date(notification.creationDate) >
              new Date(user.notificationReviewDate) &&
            notification.startDate <= nowStr &&
            notification.endDate >= nowStr
        ).length
        ? true
        : false
    );
  }, []);

  useEffect(() => {
    if (selection === SidebarSelection.NOTIFICATIONS) {
      setHasUnreadNotifications(false);
    }
  });

  return (
    <Box
      className="sidebar"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pt: 1,
        pb: 1,
        backgroundColor: primaryColor,
        borderStyle: "solid",
        borderRightWidth: 1,
        borderColor: primaryColor,
      }}
    >
      <CalendarButton
        onClick={() => navigate(CALENDAR_URL)}
        isSelected={selection === SidebarSelection.CALENDAR}
      />
      <UsersButton
        role={Role.CAFETERIA}
        onClick={() => navigate(getDefaultUsersUrl(user))}
        isSelected={selection === SidebarSelection.USERS}
      />
      <NotificationsButton
        onClick={() => navigate(NOTIFICATIONS_URL)}
        isSelected={selection === SidebarSelection.NOTIFICATIONS}
        showWarning={hasUnreadNotifications}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <OrderedMealsSidebarButton
        onClick={() => navigate(MEALS_URL)}
        isSelected={selection === SidebarSelection.MEALS}
      />
      <ShoppingCartButton
        onClick={() => navigate(CART_URL)}
        isSelected={selection === SidebarSelection.CART}
      />
      <OrdersButton
        onClick={() => navigate(ORDERS_URL)}
        isSelected={selection === SidebarSelection.ORDERS}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <LogoutButton onLogout={onLogout} />
    </Box>
  );
};

const TeacherSidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const { user, notifications } = useContext(AppContext);
  const [selection, setSelection] = useState<SidebarSelection>();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const selection = getSidebarSelection(location.pathname);
    if (selection) {
      setSelection(selection);
    }
  }, [location]);

  useEffect(() => {
    const now = new Date();
    const nowStr = DateTimeUtils.toString(now);
    setHasUnreadNotifications(
      selection != SidebarSelection.NOTIFICATIONS &&
        notifications.filter(
          (notification) =>
            new Date(notification.creationDate) >
              new Date(user.notificationReviewDate) &&
            notification.startDate <= nowStr &&
            notification.endDate >= nowStr
        ).length
        ? true
        : false
    );
  }, []);

  useEffect(() => {
    if (selection === SidebarSelection.NOTIFICATIONS) {
      setHasUnreadNotifications(false);
    }
  });

  return (
    <Box
      className="sidebar"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pt: 1,
        pb: 1,
        backgroundColor: primaryColor,
        borderStyle: "solid",
        borderRightWidth: 1,
        borderColor: primaryColor,
      }}
    >
      <CalendarButton
        onClick={() => navigate(CALENDAR_URL)}
        isSelected={selection === SidebarSelection.CALENDAR}
      />
      <UsersButton
        role={Role.TEACHER}
        onClick={() => navigate(getDefaultUsersUrl(user))}
        isSelected={selection === SidebarSelection.USERS}
      />
      <NotificationsButton
        onClick={() => navigate(NOTIFICATIONS_URL)}
        isSelected={selection === SidebarSelection.NOTIFICATIONS}
        showWarning={hasUnreadNotifications}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <OrderedMealsSidebarButton
        onClick={() => navigate(MEALS_URL)}
        isSelected={selection === SidebarSelection.MEALS}
      />
      <ShoppingCartButton
        onClick={() => navigate(CART_URL)}
        isSelected={selection === SidebarSelection.CART}
      />
      <OrdersButton
        onClick={() => navigate(ORDERS_URL)}
        isSelected={selection === SidebarSelection.ORDERS}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <LogoutButton onLogout={onLogout} />
    </Box>
  );
};

const Sidebar: React.FC = () => {
  const {
    user,
    setUser,
    setUsers,
    setMenus,
    setPantryItems: setMenuItems,
    setScheduledMenus,
    setNotifications,
  } = useContext(AppContext);

  const navigate = useNavigate();

  const handleLogout = () => {
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

  let sidebar = <ParentSidebar onLogout={handleLogout} />;
  switch (user.role) {
    case Role.ADMIN:
      sidebar = <AdminSidebar onLogout={handleLogout} />;
      break;
    case Role.TEACHER:
      sidebar = <TeacherSidebar onLogout={handleLogout} />;
      break;
    case Role.CAFETERIA:
      sidebar = <CafeteriaSidebar onLogout={handleLogout} />;
      break;
  }

  return <>{sidebar}</>;
};

const MainAppPanel: React.FC = () => {
  const location = useLocation();
  const { user } = useContext(AppContext);

  if (matchRoutes([{ path: "/" }, { path: "/admin" }], location.pathname)) {
    switch (user.role) {
      case Role.ADMIN:
        return <Navigate to={CALENDAR_URL} />;
      case Role.TEACHER:
        return <Navigate to={CALENDAR_URL} />;
      case Role.CAFETERIA:
        return <Navigate to={CALENDAR_URL} />;
      default:
        return <Navigate to={MEALS_URL} />;
    }
  }
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
      }}
    >
      <Sidebar />
      <Box
        className="wrapperpanel"
        sx={{
          flexGrow: 1,
          overflowX: "auto",
          overflowY: "auto",
          backgroundColor: grey[100],
        }}
      >
        <Box sx={{ height: "100%" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainAppPanel;
