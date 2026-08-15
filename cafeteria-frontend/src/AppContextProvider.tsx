import * as React from "react";
import { createContext, useEffect, useState, useRef, useCallback } from "react";
import SessionInfo from "./models/SessionInfo";
import SchoolUser, { NULL_SCHOOL_USER } from "./models/SchoolUser";
import Menu from "./models/Menu";
import DailyMenu from "./models/DailyMenu";
import PantryItem from "./models/PantryItem";
import Ingredient from "./models/Ingredient";
import UnitOfMeasure from "./models/UnitOfMeasure";
import CalendarNote from "./models/CalendarNote";
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
import SchoolYear, { NO_SCHOOL_YEAR } from "./models/SchoolYear";
import { Survey } from "./models/Survey";

export interface AppContextType extends SessionInfo {
  shoppingCart: ShoppingCart;
  currentSchoolYear: SchoolYear;
  inactivityTimeout: number;
  setInactivityTimeout: (inactivityTimeout: number) => void;
  setCurrentSchoolYear: (schoolYear: SchoolYear) => void;
  setShoppingCart: (shoppingCart: ShoppingCart) => void;
  setSnackbarMsg: (msg: string | undefined) => void;
  setSnackbarErrorMsg: (msg: string | undefined) => void;
  setStatusMsg: (msg: string | undefined) => void;
  setShowGlassPane: (show: boolean) => void;
  setUser: (user: SchoolUser) => void;
  setUsers: (users: SchoolUser[]) => void;
  setStudents: (students: Student[]) => void;
  setOrders: (orders: Order[]) => void;
  setMenus: (menus: Menu[]) => void;
  setSchoolYears: (menus: SchoolYear[]) => void;
  setScheduledMenus: (menus: DailyMenu[]) => void;
  setPantryItems: (pantryItems: PantryItem[]) => void;
  setIngredients: (ingredients: Ingredient[]) => void;
  setUnitsOfMeasure: (unitsOfMeasure: UnitOfMeasure[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setCalendarNotes: (calendarNotes: CalendarNote[]) => void;
  setSchool: (school: School) => void;
  setSurvey: (survey: Survey | null) => void;
}

const DEFAULT_SYSTEM_DEFAULTS: School = {
  name: "",
  registrationCode: "",
  openRegistration: false,
  squareAppAccessToken: "",
  orderStartPeriodCount: 2,
  orderStartRelativeTo: 0,
  orderStartTime: "00:00",
  orderEndPeriodCount: 1,
  orderEndRelativeTo: 0,
  orderEndTime: "00:00",
  emailReportStartPeriodCount: 1,
  emailReportStartPeriodType: 0,
  emailReportStartRelativeTo: 0,
  emailReportStartTime: "00:00",
  mealPrice: 0.0,
  drinkOnlyPrice: 0.0,
  squareAppId: "",
  squareLocationId: "",
  factsApiKey: "",
  timezone: "America/New_York",
};

export const INITIAL_APP_CONTEXT: AppContextType = {
  shoppingCart: { items: [] },
  users: [],
  user: NULL_SCHOOL_USER,
  schoolYears: [],
  menus: [],
  students: [],
  orders: [],
  scheduledMenus: [],
  pantryItems: [],
  ingredients: [],
  unitsOfMeasure: [],
  notifications: [],
  calendarNotes: [],
  school: DEFAULT_SYSTEM_DEFAULTS,
  currentSchoolYear: NO_SCHOOL_YEAR,
  inactivityTimeout: 30,
  setInactivityTimeout: () => {},
  setCurrentSchoolYear: () => {},
  setShoppingCart: () => {},
  setStatusMsg: () => {},
  setSnackbarMsg: () => {},
  setSnackbarErrorMsg: () => {},
  setShowGlassPane: () => {},
  setUser: () => {},
  setUsers: () => {},
  setSchoolYears: () => {},
  setStudents: () => {},
  setOrders: () => {},
  setMenus: () => {},
  setScheduledMenus: () => {},
  setPantryItems: () => {},
  setIngredients: () => {},
  setUnitsOfMeasure: () => {},
  setNotifications: () => {},
  setCalendarNotes: () => {},
  setSchool: () => {},
  setSurvey: () => {},
  survey: null,
};

export const AppContext = createContext<AppContextType>(INITIAL_APP_CONTEXT);

const AppContextProvider: React.FC<React.PropsWithChildren> = (props) => {
  const [shoppingCart, setShoppingCart] = useState<ShoppingCart>({ items: [] });
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<UnitOfMeasure[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [scheduledMenus, setScheduledMenus] = useState<DailyMenu[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<SchoolYear>({
    id: 0,
    oneTeacherPerStudent: true,
    name: "",
    startDate: "",
    endDate: "",
    factsId: null,
    isCurrent: false,
    hideSchedule: true,
    lunchTimes: [],
    teacherLunchTimes: [],
    gradeLunchTimes: [],
    studentLunchTimes: [],
    gradesAssignedByClass: [],
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<SchoolUser>(NULL_SCHOOL_USER);
  const [users, setUsers] = useState<SchoolUser[]>([]);
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
  const [showLogoutWarning, setShowLogoutWarning] = useState<boolean>(false);
  const [inactivityTimeout, setInactivityTimeout] = useState<number>(30); // in minutes
  const [survey, setSurvey] = useState<Survey | null>(null);


  // Auto-logout functionality
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showLogoutWarningRef = useRef<boolean>(false);
  const WARNING_DURATION = 60 * 1000; // 1 minute warning duration

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    // Hide warning dialog if it's showing
    setShowLogoutWarning(false);
    showLogoutWarningRef.current = false;
    
    // Only set timer if user is logged in
    if (user.id !== NULL_SCHOOL_USER.id) {
      // Set warning timer (29 minutes)
      warningTimerRef.current = setTimeout(() => {
        setShowLogoutWarning(true);
        showLogoutWarningRef.current = true;
        
        // Set final logout timer (1 minute after warning)
        inactivityTimerRef.current = setTimeout(() => {
          handleAutoLogout();
        }, WARNING_DURATION);
      }, inactivityTimeout * 60 * 1000);
    }
  }, [user.id, inactivityTimeout]);

  const handleAutoLogout = useCallback(() => {
    // Clear the JWT token
    localStorage.removeItem("jwtToken");
    
    // Reset user state
    setUser(NULL_SCHOOL_USER);
    setUsers([]);
    setStudents([]);
    setOrders([]);
    setMenus([]);
    setScheduledMenus([]);
        setPantryItems([]);
        setIngredients([]);
        setUnitsOfMeasure([]);
        setNotifications([]);
        setSchoolYears([]);
        setCurrentSchoolYear(NO_SCHOOL_YEAR);
        setShoppingCart({ items: [] });
        setSurvey(null);
    
    // Hide warning dialog
    setShowLogoutWarning(false);
    showLogoutWarningRef.current = false;
    
    // Clear all timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  const handleStayLoggedIn = useCallback(() => {
    // Hide warning dialog
    setShowLogoutWarning(false);
    showLogoutWarningRef.current = false;
    
    // Reset the inactivity timer
    resetInactivityTimer();
    
  }, [resetInactivityTimer]);

  // Set up activity listeners
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      // Only reset timer if warning dialog is not showing
      if (!showLogoutWarningRef.current) {
        resetInactivityTimer();
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

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
        sessionInfo.students.sort((s1, s2) => {
          const s1Name = s1.firstName + " " + s1.lastName;
          const s2Name = s2.firstName + " " + s2.lastName;
          return s1Name.toLowerCase().localeCompare(s2Name.toLowerCase());
        });
        setUser(sessionInfo.user);
        setUsers(sessionInfo.users);
        setStudents(sessionInfo.students);
        setOrders(sessionInfo.orders);
        setMenus(sessionInfo.menus);
        setScheduledMenus(sessionInfo.scheduledMenus);
        setPantryItems(sessionInfo.pantryItems);
        setIngredients(sessionInfo.ingredients);
        setUnitsOfMeasure(sessionInfo.unitsOfMeasure);
        setNotifications(sessionInfo.notifications);
        setCalendarNotes(sessionInfo.calendarNotes ?? []);
        setSchool(sessionInfo.school);
        setIsInitialized(true);
        setSchoolYears(sessionInfo.schoolYears);
        setCurrentSchoolYear(sessionInfo.schoolYears.find((sy) => sy.isCurrent) ?? NO_SCHOOL_YEAR);
        setSurvey(sessionInfo.survey);
        
        // Reset inactivity timer when user logs in
        resetInactivityTimer();
  
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
        ingredients,
        unitsOfMeasure,
        notifications,
        calendarNotes,
        school: school,
        schoolYears,
        currentSchoolYear,
        inactivityTimeout,
        setInactivityTimeout,
        setCurrentSchoolYear,
        setShoppingCart,
        setStatusMsg,
        setSnackbarMsg,
        setSnackbarErrorMsg,
        setShowGlassPane,
        setPantryItems,
        setIngredients,
        setUnitsOfMeasure,
        setNotifications,
        setCalendarNotes,
        setUsers,
        setStudents,
        setOrders,
        setMenus,
        setScheduledMenus,
        setUser,
        setSchool,
        setSchoolYears,
        setSurvey,
        survey,
      }}
    >
      <Box
        sx={{
          height: "100vh",
        }}
      >
        {props.children}
        {!statusMsg ? (
          <></>
        ) : (
          <InfoDialog msg={statusMsg} onOk={() => setStatusMsg(undefined)} />
        )}
        {showLogoutWarning && (
          <InfoDialog 
            msg="You will be automatically logged out in 1 minute due to inactivity. Click OK to stay logged in." 
            onOk={handleStayLoggedIn} 
          />
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
          autoHideDuration={snackbarErrorMsg ? 5000 : 2000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            severity={snackbarErrorMsg ? "error" : "success"}
            variant={snackbarErrorMsg ? "filled" : undefined}
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
