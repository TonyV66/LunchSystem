import * as React from "react";
import Box from "@mui/material/Box";
import { Divider, Typography } from "@mui/material";
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
  Home,
  Logout,
  People,
  ReceiptLong,
  Settings,
  ShoppingCart,
  SpeakerNotes,
} from "@mui/icons-material";
import { NULL_USER, Role } from "./models/User";
import { grey, red } from "@mui/material/colors";
import { DateTimeUtils } from "./DateTimeUtils";

const ALT_COLOR = "#ffffff";

export const REGISTRATION_URL = "/register";
export const ACCOUNT_URL = "/account";
export const USERS_URL = "/users";
export const MEALS_URL = "/meals";
export const LOGIN_URL = "/login";
export const CART_URL = "/cart";
export const CALENDAR_URL = "/calendar";
export const ORDERS_URL = "/orders";
export const STUDENTS_URL = "/students";

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
}

const primaryColor = "primary.dark";

interface SidebarProps {
  onLogout: () => void;
}

interface SidebarButtonProps {
  onClick: (selection: SidebarSelection) => void;
  isSelected: boolean;
  showWarning?: boolean;
}
const HomeSidebarButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  return (
    <Home
      onClick={() => onClick(SidebarSelection.MEALS)}
      sx={{
        cursor: !isSelected ? "pointer" : undefined,
        p: 1,
        backgroundColor: isSelected ? ALT_COLOR : undefined,
        color: isSelected ? primaryColor : ALT_COLOR,
      }}
      fontSize="large"
    />
  );
};

const CalendarButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  return (
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
  );
};


const NotificationsButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
  showWarning,
}) => {
  return (
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
  );
};

const UsersButton: React.FC<SidebarButtonProps> = ({ onClick, isSelected }) => {
  return (
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
  );
};

const SettingsButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  return (
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
  );
};

const OrdersButton: React.FC<SidebarButtonProps> = ({
  onClick,
  isSelected,
}) => {
  return (
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
    </Box>
  );
};

const AdminSidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [selection, setSelection] = useState<SidebarSelection>();
  const location = useLocation();

  useEffect(() => {
    if (matchRoutes([{ path: ACCOUNT_URL }], location.pathname)) {
      setSelection(SidebarSelection.ACCOUNT);
    } else if (matchRoutes([{ path: MEALS_URL }], location.pathname)) {
      setSelection(SidebarSelection.MEALS);
    } else if (matchRoutes([{ path: USERS_URL }, { path: STUDENTS_URL }], location.pathname)) {
      setSelection(SidebarSelection.USERS);
    } else if (matchRoutes([{ path: CART_URL }], location.pathname)) {
      setSelection(SidebarSelection.CART);
    } else if (matchRoutes([{ path: CALENDAR_URL }], location.pathname)) {
      setSelection(SidebarSelection.CALENDAR);
    } else if (matchRoutes([{ path: ORDERS_URL }], location.pathname)) {
      setSelection(SidebarSelection.ORDERS);
    } else if (matchRoutes([{ path: NOTIFICATIONS_URL }], location.pathname)) {
      setSelection(SidebarSelection.NOTIFICATIONS);
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
      <NotificationsButton
        onClick={() => navigate(NOTIFICATIONS_URL)}
        isSelected={selection === SidebarSelection.NOTIFICATIONS}
      />
      <UsersButton
        onClick={() => navigate(USERS_URL)}
        isSelected={selection === SidebarSelection.USERS}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <SettingsButton
        onClick={() => navigate(ACCOUNT_URL)}
        isSelected={selection === SidebarSelection.ACCOUNT}
      />
      <Logout
        onClick={onLogout}
        sx={{ cursor: "pointer", p: 1, color: ALT_COLOR }}
        fontSize="large"
      />
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
    if (matchRoutes([{ path: ACCOUNT_URL }], location.pathname)) {
      setSelection(SidebarSelection.ACCOUNT);
    } else if (matchRoutes([{ path: MEALS_URL }], location.pathname)) {
      setSelection(SidebarSelection.MEALS);
    } else if (matchRoutes([{ path: ORDERS_URL }], location.pathname)) {
      setSelection(SidebarSelection.ORDERS);
    } else if (matchRoutes([{ path: CART_URL }], location.pathname)) {
      setSelection(SidebarSelection.CART);
    } else if (matchRoutes([{ path: CALENDAR_URL }], location.pathname)) {
      setSelection(SidebarSelection.CALENDAR);
    } else if (matchRoutes([{ path: NOTIFICATIONS_URL }], location.pathname)) {
      setSelection(SidebarSelection.NOTIFICATIONS);
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
      <HomeSidebarButton
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
      <NotificationsButton
        onClick={() => navigate(NOTIFICATIONS_URL)}
        isSelected={selection === SidebarSelection.NOTIFICATIONS}
        showWarning={hasUnreadNotifications}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <SettingsButton
        onClick={() => navigate(ACCOUNT_URL)}
        isSelected={selection === SidebarSelection.ACCOUNT}
      />
      <Logout
        onClick={onLogout}
        sx={{ cursor: "pointer", p: 1, color: ALT_COLOR }}
        fontSize="large"
      />
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
    if (matchRoutes([{ path: ACCOUNT_URL }], location.pathname)) {
      setSelection(SidebarSelection.ACCOUNT);
    } else if (matchRoutes([{ path: CALENDAR_URL }], location.pathname)) {
      setSelection(SidebarSelection.CALENDAR);
    } else if (matchRoutes([{ path: NOTIFICATIONS_URL }], location.pathname)) {
      setSelection(SidebarSelection.NOTIFICATIONS);
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
      <NotificationsButton
        onClick={() => navigate(NOTIFICATIONS_URL)}
        isSelected={selection === SidebarSelection.NOTIFICATIONS}
        showWarning={hasUnreadNotifications}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <SettingsButton
        onClick={() => navigate(ACCOUNT_URL)}
        isSelected={selection === SidebarSelection.ACCOUNT}
      />
      <Logout
        onClick={onLogout}
        sx={{ cursor: "pointer", p: 1, color: ALT_COLOR }}
        fontSize="large"
      />
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
    if (matchRoutes([{ path: ACCOUNT_URL }], location.pathname)) {
      setSelection(SidebarSelection.ACCOUNT);
    } else if (matchRoutes([{ path: CALENDAR_URL }], location.pathname)) {
      setSelection(SidebarSelection.CALENDAR);
    } else if (matchRoutes([{ path: NOTIFICATIONS_URL }], location.pathname)) {
      setSelection(SidebarSelection.NOTIFICATIONS);
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
      <NotificationsButton
        onClick={() => navigate(NOTIFICATIONS_URL)}
        isSelected={selection === SidebarSelection.NOTIFICATIONS}
        showWarning={hasUnreadNotifications}
      />
      <Divider sx={{ borderColor: "white", width: "100%" }} />
      <SettingsButton
        onClick={() => navigate(ACCOUNT_URL)}
        isSelected={selection === SidebarSelection.ACCOUNT}
      />
      <Logout
        onClick={onLogout}
        sx={{ cursor: "pointer", p: 1, color: ALT_COLOR }}
        fontSize="large"
      />
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
