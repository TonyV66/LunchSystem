import * as React from "react";
import CalendarPage from "./components/mealplan/CalendarPage";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  matchRoutes,
  useLocation,
} from "react-router-dom";
import MainAppPanel, {
  ACCOUNT_URL,
  LOGIN_URL,
  MEALS_URL,
  CALENDAR_URL,
  KITCHEN_URL,
} from "./MainAppPanel";
import ShoppingCartPage from "./components/shoppingcart/ShoppingCartPage";
import OrderedMealsPage from "./components/meals/OrderedMealsPage";
import { useContext } from "react";
import { AppContext } from "./AppContextProvider";
import LoginPanel from "./components/users/LoginPanel";
import { Role } from "./models/User";
import NotificationsPage from "./components/notifications/NotificationsPage";
import OrderHistoryPage from "./components/orders/OrderHistoryPage";
import PlannerPage from "./components/mealplan/PlannerPage";
import UsersPage from "./components/users/UsersPage";
import StudentsPage from "./components/users/StudentsPage";
import RegistrationPanel from "./components/users/RegistrationPanel";
import ChangeForgottenPwdPanel from "./components/users/ChangeForgottenPwdPanel";
import PageNotFound from "./components/PageNotFound";
import SchoolYearsPage from "./components/schoolyear/SchoolYearsPage";
import SchoolYearTabsPanel from "./components/schoolyear/SchoolYearTabsPanel";
import FamilyPage from "./components/users/FamilyPage";
import ClassroomStudentsPage from "./components/users/ClassroomStudentsPage";
import SchoolSettingsPage from "./components/settings/SchoolSettingsPage";
import { Box, Stack, Typography } from "@mui/material";
import PrincipalsCalendar from "./components/mealplan/PrincipalsCalendar";
import KitchenPage from "./components/cafeteria/KitchenPage";
import AdminSurveyPage from "./components/survey/AdminSurveyPage";

const AppWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  return (
    <Box
      sx={{
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "grey.500",
        maxWidth: !matchRoutes(
          [{ path: KITCHEN_URL + "/:date?" }],
          location.pathname,
        )
          ? "1200px"
          : "100%",
        height: "100%",
        marginLeft: "auto",
        marginRight: "auto",
        overflow: "hidden",
        paddingLeft: "0px",
        paddingRight: "0px",
      }}
    >
      {children}
    </Box>
  );
};
const App: React.FC = () => {
  const { user } = useContext(AppContext);

  let defaultUrl = ACCOUNT_URL;
  switch (user.role) {
    case Role.KITCHEN:
      defaultUrl = KITCHEN_URL;
      break;
    case Role.ADMIN:
    case Role.TEACHER:
    case Role.CAFETERIA:
    case Role.PRINCIPAL:
      defaultUrl = CALENDAR_URL;
      break;
    default:
      defaultUrl = MEALS_URL;
      break;
  }

  const getUserRoutes = () => {
    return (
      <>
        <Route path="calendar" element={<CalendarPage></CalendarPage>} />
        <Route
          path="orders"
          element={<OrderHistoryPage purchaser={user}></OrderHistoryPage>}
        />
        <Route path="meals" element={<OrderedMealsPage></OrderedMealsPage>} />
        <Route path="cart" element={<ShoppingCartPage></ShoppingCartPage>} />
        <Route path="family" element={<FamilyPage></FamilyPage>} />
        <Route path="notifications" element={<NotificationsPage />} />
      </>
    );
  };
  const getKitchenRoutes = () => {
    return (
      <Route path="kitchen/:date?" element={<KitchenPage></KitchenPage>} />
    );
  };
  const getPrincipalRoutes = () => {
    return (
      <>
        <Route
          path="calendar"
          element={<PrincipalsCalendar></PrincipalsCalendar>}
        />
        <Route path="orders" element={<OrderHistoryPage></OrderHistoryPage>} />
        <Route path="users" element={<UsersPage></UsersPage>} />
        <Route path="students" element={<StudentsPage></StudentsPage>} />
        <Route path="notifications" element={<NotificationsPage />} />
      </>
    );
  };
  const getCafeteriaRoutes = () => {
    return (
      <>
        <Route path="calendar" element={<CalendarPage></CalendarPage>} />
        <Route path="students" element={<StudentsPage></StudentsPage>} />
        <Route path="notifications" element={<NotificationsPage />} />
      </>
    );
  };
  const getTeacherRoutes = () => {
    return (
      <>
        <Route path="calendar" element={<CalendarPage></CalendarPage>} />
        <Route
          path="orders"
          element={<OrderHistoryPage purchaser={user}></OrderHistoryPage>}
        />
        <Route path="meals" element={<OrderedMealsPage></OrderedMealsPage>} />
        <Route path="cart" element={<ShoppingCartPage></ShoppingCartPage>} />
        <Route path="family" element={<FamilyPage></FamilyPage>} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="students" element={<StudentsPage></StudentsPage>} />
        <Route
          path="classroom"
          element={<ClassroomStudentsPage></ClassroomStudentsPage>}
        />
      </>
    );
  };
  const getAdminRoutes = () => {
    return (
      <>
        <Route path="calendar" element={<PlannerPage></PlannerPage>} />
        <Route path="orders" element={<OrderHistoryPage></OrderHistoryPage>} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users" element={<UsersPage></UsersPage>} />
        <Route path="students" element={<StudentsPage></StudentsPage>} />
        <Route path="account" element={<SchoolSettingsPage />} />
        <Route path="years" element={<SchoolYearsPage />} />
        <Route path="year/:yearId" element={<SchoolYearTabsPanel />} />
        <Route path="year/:yearId/teachers" element={<SchoolYearTabsPanel />} />
        <Route path="year/:yearId/grades" element={<SchoolYearTabsPanel />} />
        <Route path="survey" element={<AdminSurveyPage />} />
      </>
    );
  };

  const getPublicRoutes = () => {
    if (user.id) {
      return (
        <>
          <Route
            path="/noregister"
            element={<Navigate to={defaultUrl} replace />}
          />

          <Route
            path="/register/:invitationId"
            element={<Navigate to={defaultUrl} replace />}
          />
          <Route path="/login" element={<Navigate to={defaultUrl} replace />} />
          <Route
            path="/forgot/:forgottenLoginId"
            element={<Navigate to={defaultUrl} replace />}
          />
          <Route path="/admin" element={<Navigate to={defaultUrl} replace />} />
        </>
      );
    }
    return (
      <>
        <Route
          path="/noregister"
          element={
            <Stack
              sx={{
                height: "100vh",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                src="/logo.jpg"
                style={{ display: "block", width: "300px", height: "auto" }}
                alt="logo"
              />
              <Typography variant="h4">
                Not Yet Open For Lunch System Registration
              </Typography>
            </Stack>
          }
        />
        <Route path="/register/:invitationId" element={<RegistrationPanel />} />
        <Route path="/login" element={<LoginPanel />} />
        <Route
          path="/forgot/:forgottenLoginId"
          element={<ChangeForgottenPwdPanel />}
        />
        <Route path="/admin" element={<LoginPanel />} />
        <Route path="/" element={<Navigate to={LOGIN_URL} replace />} />
      </>
    );
  };

  return (
    <BrowserRouter>
      <AppWrapper>
        <Routes>
          {getPublicRoutes()}
          <Route path="/" element={<MainAppPanel />}>
            {(user.role === Role.PARENT || user.role === Role.STAFF) &&
              getUserRoutes()}
            {user.role === Role.ADMIN && getAdminRoutes()}
            {user.role === Role.PRINCIPAL && getPrincipalRoutes()}
            {user.role === Role.CAFETERIA && getCafeteriaRoutes()}
            {user.role === Role.TEACHER && getTeacherRoutes()}
          </Route>
          {user.role === Role.KITCHEN && getKitchenRoutes()}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </AppWrapper>
    </BrowserRouter>
  );
};

export default App;
