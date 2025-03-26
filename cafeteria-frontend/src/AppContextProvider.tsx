import * as React from "react";
import { createContext, useEffect, useState } from "react";
import SessionInfo from "./models/SessionInfo";
import User, { NULL_USER } from "./models/User";
import Menu, { DailyMenu, PantryItem } from "./models/Menu";
import {
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import InfoDialog from "./components/InfoDialog";
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { fetchSessionInfo, http } from "./api/CafeteriaClient";
import { Order } from "./models/Order";
import Student from "./models/Student";
import { Notification } from "./models/Notification";
import School from "./models/School";
import { ShoppingCart } from "./models/ShoppingCart";
import SchoolYear from "./models/SchoolYear";

export interface AppContextType extends SessionInfo {
  shoppingCart: ShoppingCart;
  setShoppingCart: (shoppingCart: ShoppingCart) => void;
  setSnackbarMsg: (msg: string | undefined) => void;
  setSnackbarErrorMsg: (msg: string | undefined) => void;
  setStatusMsg: (msg: string | undefined) => void;
  setShowGlassPane: (show: boolean) => void;
  setUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  setStudents: (students: Student[]) => void;
  setOrders: (orders: Order[]) => void;
  setMenus: (menus: Menu[]) => void;
  setScheduledMenus: (menus: DailyMenu[]) => void;
  setPantryItems: (pantryItems: PantryItem[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setSchool: (school: School) => void;
  setSchoolYear: (schoolYear: SchoolYear) => void;
}

const DEFAULT_SCHOOL_YEAR: SchoolYear = {
  id: 0,
  startDate: "2000-01-01",
  endDate: "2001-01-01",
  lunchTimes: [],
};

const DEFAULT_SYSTEM_DEFAULTS: School = {
  id: 0,
  orderStartPeriodCount: 2,
  orderStartPeriodType: 0,
  orderStartRelativeTo: 0,
  orderStartTime: "00:00",
  orderEndPeriodCount: 1,
  orderEndPeriodType: 0,
  orderEndRelativeTo: 0,
  orderEndTime: "00:00",
  mealPrice: 0.0,
  drinkOnlyPrice: 0.0,
  squareAppId: "",
  squareLocationId: "",
};

export const INITIAL_APP_CONTEXT: AppContextType = {
  shoppingCart: { items: [] },
  users: [],
  user: NULL_USER,
  menus: [],
  students: [],
  orders: [],
  scheduledMenus: [],
  pantryItems: [],
  notifications: [],
  school: DEFAULT_SYSTEM_DEFAULTS,
  schoolYear: DEFAULT_SCHOOL_YEAR,
  setShoppingCart: () => {},
  setStatusMsg: () => {},
  setSnackbarMsg: () => {},
  setSnackbarErrorMsg: () => {},
  setShowGlassPane: () => {},
  setUser: () => {},
  setUsers: () => {},
  setStudents: () => {},
  setOrders: () => {},
  setMenus: () => {},
  setScheduledMenus: () => {},
  setPantryItems: () => {},
  setNotifications: () => {},
  setSchool: () => {},
  setSchoolYear: () => {},
};

export const AppContext = createContext<AppContextType>(INITIAL_APP_CONTEXT);

const AppContextProvider: React.FC<React.PropsWithChildren> = (props) => {
  const [shoppingCart, setShoppingCart] = useState<ShoppingCart>({ items: [] });
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [scheduledMenus, setScheduledMenus] = useState<DailyMenu[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<User>(NULL_USER);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | undefined>();
  const [snackbarMsg, setSnackbarMsg] = useState<string | undefined>();
  const [snackbarErrorMsg, setSnackbarErrorMsg] = useState<
    string | undefined
  >();
  const [showGlassPane, setShowGlassPane] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [school, setSchool] = useState<School>(DEFAULT_SYSTEM_DEFAULTS);
  const [schoolYear, setSchoolYear] = useState<SchoolYear>(DEFAULT_SCHOOL_YEAR);

  const requestOkInterceptor = (
    config:
      | InternalAxiosRequestConfig<unknown>
      | Promise<InternalAxiosRequestConfig<unknown>>
  ) => {
    const jwtToken = localStorage.getItem("jwtToken");

    setSnackbarErrorMsg(undefined);
    setSnackbarMsg(undefined);
    setShowGlassPane(true);

    console.log(
      jwtToken ? "using jwtToken = " + jwtToken : "no jwtToken found"
    );

    if (jwtToken) {
      (config as InternalAxiosRequestConfig).headers.Authorization =
        "Bearer " + jwtToken;
    }
    return config;
  };

  const requestErrorInterceptor = (error: unknown) => {
    setShowGlassPane(false);
    return Promise.reject(error);
  };

  const responseOkInterceptor = (
    response:
      | AxiosResponse<unknown, unknown>
      | Promise<AxiosResponse<unknown, unknown>>
  ) => {
    setShowGlassPane(false);
    return response;
  };

  const responseErrorInterceptor = (error: AxiosError) => {
    setShowGlassPane(false);
    return Promise.reject(error);
  };

  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarMsg(undefined);
    setSnackbarErrorMsg(undefined);
  };

  useEffect(() => {
    const responseInterceptor = http.interceptors.response.use(
      responseOkInterceptor,
      responseErrorInterceptor
    );

    const requestInterceptor = http.interceptors.request.use(
      requestOkInterceptor,
      requestErrorInterceptor
    );

    const initSession = async () => {
      try {
        const sessionInfo = await fetchSessionInfo();
        sessionInfo.students.sort((s1, s2) =>
          s1.name.toLowerCase().localeCompare(s2.name.toLowerCase())
        );
        setUser(sessionInfo.user);
        setUsers(sessionInfo.users);
        setStudents(sessionInfo.students);
        setOrders(sessionInfo.orders);
        setMenus(sessionInfo.menus);
        setScheduledMenus(sessionInfo.scheduledMenus);
        setPantryItems(sessionInfo.pantryItems);
        setNotifications(sessionInfo.notifications);
        setSchool(sessionInfo.school);
        setSchoolYear(sessionInfo.schoolYear);
        setIsInitialized(true);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setIsInitialized(true);
      }
    };

    initSession();

    return () => {
      http.interceptors.request.eject(requestInterceptor);
      http.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    if (snackbarMsg) {
      setSnackbarErrorMsg(undefined);
    }
  }, [snackbarMsg]);

  useEffect(() => {
    if (snackbarErrorMsg) {
      setSnackbarMsg(undefined);
    }
  }, [snackbarErrorMsg]);

  if (!isInitialized) {
    return <></>;
  }

  return (
    <AppContext.Provider
      value={{
        shoppingCart,
        user,
        users,
        students,
        orders,
        menus,
        scheduledMenus,
        pantryItems,
        notifications,
        school: school,
        schoolYear,
        setShoppingCart,
        setStatusMsg,
        setSnackbarMsg,
        setSnackbarErrorMsg,
        setShowGlassPane,
        setPantryItems,
        setNotifications,
        setUsers,
        setStudents,
        setOrders,
        setMenus,
        setScheduledMenus,
        setUser,
        setSchool,
        setSchoolYear,
      }}
    >
      <Box
        sx={{
          borderStyle: "solid",
          borderWidth: 1,
          borderColor: "grey.500",
          maxWidth: "1200px",
          height: "100vh",
          marginLeft: "auto",
          marginRight: "auto",
          overflow: "hidden",
          paddingLeft: "0px",
          paddingRight: "0px",
        }}
      >
        {props.children}
        {!statusMsg ? (
          <></>
        ) : (
          <InfoDialog msg={statusMsg} onOk={() => setStatusMsg(undefined)} />
        )}
        <Backdrop
          sx={{
            zIndex: (theme) =>
              Math.max.apply(Math, Object.values(theme.zIndex)) + 1,
          }}
          open={showGlassPane}
          onClick={() => {}}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Snackbar
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={snackbarMsg || snackbarErrorMsg ? true : false}
          autoHideDuration={snackbarErrorMsg ? 3000 : 1000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            severity={snackbarErrorMsg ? "error" : "success"}
            onClose={handleCloseSnackbar}
          >
            {snackbarMsg || snackbarErrorMsg || undefined}
          </Alert>
        </Snackbar>
      </Box>
    </AppContext.Provider>
  );
};

export default AppContextProvider;
