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
  CAFETERIA_URL,
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
import UserImportTest from "./components/users/UserImportTest";
import FamilyPage from "./components/users/FamilyPage";
import ClassroomStudentsPage from "./components/users/ClassroomStudentsPage";
import SchoolSettingsPage from "./components/settings/SchoolSettingsPage";
import { Box, Stack, Typography } from "@mui/material";
import PrincipalsCalendar from "./components/mealplan/PrincipalsCalendar";
import CafeteriaPage from "./components/cafeteria/CafeteriaPage";

const AppWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  return (
    <Box
      sx={{
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "grey.500",
        maxWidth: !matchRoutes(
          [{ path: CAFETERIA_URL + "/:date?" }],
          location.pathname
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

  return (
    <BrowserRouter>
      <AppWrapper>
        <Routes>
          <Route
            path="/noregister"
            element={
              user.id ? (
                <Navigate to={"/"} replace />
              ) : (
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
                  <Typography variant="h6">
                    You will receive an email when registration is open.
                  </Typography>
                </Stack>
              )
            }
          />
          <Route
            path="/register"
            element={
              user.id ? <Navigate to={"/"} replace /> : <RegistrationPanel />
            }
          />
          <Route
            path="/login"
            element={
              user.id ? <Navigate to={defaultUrl} replace /> : <LoginPanel />
            }
          />
          <Route
            path="/forgot/:forgottenLoginId"
            element={
              user.id ? (
                <Navigate to={defaultUrl} replace />
              ) : (
                <ChangeForgottenPwdPanel />
              )
            }
          />

          <Route
            path="/admin"
            element={
              user.id ? <Navigate to={defaultUrl} replace /> : <LoginPanel />
            }
          />
          <Route
            path="/"
            element={
              !user.id ? <Navigate to={LOGIN_URL} replace /> : <MainAppPanel />
            }
          >
            {user.role === Role.PARENT || user.role === Role.STAFF ? (
              <>
                <Route
                  path="calendar"
                  element={<CalendarPage></CalendarPage>}
                />
                <Route
                  path="meals"
                  element={<OrderedMealsPage></OrderedMealsPage>}
                />
                <Route
                  path="cart"
                  element={<ShoppingCartPage></ShoppingCartPage>}
                />
              </>
            ) : (
              <></>
            )}
            {user.role === Role.CAFETERIA || user.role === Role.ADMIN || user.role === Role.PRINCIPAL || user.role === Role.TEACHER ? (
              <>
                <Route
                  path="cafeteria/:date"
                  element={<CafeteriaPage></CafeteriaPage>}
                />
              </>
            ) : (
              <></>
            )}

            {user.role === Role.PRINCIPAL ? (
              <>
                <Route
                  path="calendar"
                  element={<PrincipalsCalendar></PrincipalsCalendar>}
                />
                <Route
                  path="meals"
                  element={<OrderedMealsPage></OrderedMealsPage>}
                />
                <Route
                  path="cart"
                  element={<ShoppingCartPage></ShoppingCartPage>}
                />
                <Route path="users" element={<UsersPage></UsersPage>} />
                <Route
                  path="students"
                  element={<StudentsPage></StudentsPage>}
                />
              </>
            ) : (
              <></>
            )}
            {user.role === Role.ADMIN ? (
              <>
                <Route path="calendar" element={<PlannerPage></PlannerPage>} />
                <Route
                  path="meals"
                  element={<OrderedMealsPage></OrderedMealsPage>}
                />
                <Route
                  path="cart"
                  element={<ShoppingCartPage></ShoppingCartPage>}
                />
                <Route path="users" element={<UsersPage></UsersPage>} />
                <Route
                  path="students"
                  element={<StudentsPage></StudentsPage>}
                />
                <Route path="account" element={<SchoolSettingsPage />} />
                <Route path="years" element={<SchoolYearsPage />} />
                <Route path="year/:yearId" element={<SchoolYearTabsPanel />} />
                <Route
                  path="year/:yearId/teachers"
                  element={<SchoolYearTabsPanel />}
                />
                <Route
                  path="year/:yearId/grades"
                  element={<SchoolYearTabsPanel />}
                />
                <Route path="import-test" element={<UserImportTest />} />
              </>
            ) : (
              <></>
            )}

            {user.role === Role.CAFETERIA ? (
              <>
                <Route
                  path="students"
                  element={<StudentsPage></StudentsPage>}
                />
                <Route
                  path="calendar"
                  element={<CalendarPage></CalendarPage>}
                />
                <Route
                  path="cart"
                  element={<ShoppingCartPage></ShoppingCartPage>}
                />
                <Route
                  path="meals"
                  element={<OrderedMealsPage></OrderedMealsPage>}
                />
              </>
            ) : (
              <></>
            )}

            {user.role === Role.TEACHER ? (
              <>
                <Route
                  path="students"
                  element={<StudentsPage></StudentsPage>}
                />
                <Route
                  path="classroom"
                  element={<ClassroomStudentsPage></ClassroomStudentsPage>}
                />
                <Route
                  path="calendar"
                  element={<CalendarPage></CalendarPage>}
                />
                <Route
                  path="cart"
                  element={<ShoppingCartPage></ShoppingCartPage>}
                />
                <Route
                  path="meals"
                  element={<OrderedMealsPage></OrderedMealsPage>}
                />
              </>
            ) : (
              <></>
            )}

            <Route
              path="orders"
              element={
                <OrderHistoryPage
                  purchaser={
                    user.role === Role.ADMIN || user.role === Role.PRINCIPAL
                      ? undefined
                      : user
                  }
                ></OrderHistoryPage>
              }
            />
            <Route path="family" element={<FamilyPage></FamilyPage>} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </AppWrapper>
    </BrowserRouter>
  );
};

export default App;
