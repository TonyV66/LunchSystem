import * as React from "react";
import CalendarPage from "./components/mealplan/CalendarPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainAppPanel, {
  ACCOUNT_URL,
  LOGIN_URL,
  MEALS_URL,
  CALENDAR_URL,
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
import AdminSettingsPage from "./components/settings/AdminSettingsPage";
import ChangePasswordPage from "./components/settings/ChangePasswordPage";
import InvitationPanel from "./components/users/InvitationPanel";
import RegistrationPanel from "./components/users/RegistrationPanel";
import ChangeForgottenPwdPanel from "./components/users/ChangeForgottenPwdPanel";
import PageNotFound from "./components/PageNotFound";
import SchoolYearsPage from "./components/schoolyear/SchoolYearsPage";

const App: React.FC = () => {
  const { user } = useContext(AppContext);

  let defaultUrl = ACCOUNT_URL;
  switch (user.role) {
    case Role.ADMIN:
      defaultUrl = CALENDAR_URL;
      break;
    case Role.TEACHER:
      defaultUrl = CALENDAR_URL;
      break;
    case Role.CAFETERIA:
      defaultUrl = CALENDAR_URL;
      break;
    case Role.PARENT:
      defaultUrl = MEALS_URL;
      break;
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user.id || user.role === Role.PARENT ? (
          <>
            <Route path="/invite/:inviteId" element={<InvitationPanel />} />
            <Route
              path="/register/:inviteId"
              element={
                user.id ? (
                  <Navigate to={"/"} replace />
                ) : (
                  <RegistrationPanel />
                )
              }
            />
            <Route
              path="/login/:inviteId"
              element={
                user.id ? (
                  <Navigate to={"/"} replace />
                ) : (
                  <LoginPanel />
                )
              }
            />
          </>
        ) : (
          <></>
        )}

        <Route
          path="/login"
          element={
            user.id ? <Navigate to={defaultUrl} replace /> : <LoginPanel />
          }
        />
        <Route
          path="/forgot/:forgottenLoginId"
          element={
            user.id ? <Navigate to={defaultUrl} replace /> : <ChangeForgottenPwdPanel />
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
          {user.role === Role.PARENT ? (
            <>
              <Route path="calendar" element={<CalendarPage></CalendarPage>} />
              <Route
                path="meals"
                element={<OrderedMealsPage></OrderedMealsPage>}
              />
              <Route
                path="orders"
                element={<OrderHistoryPage purchaser={user}></OrderHistoryPage>}
              />
              <Route
                path="cart"
                element={<ShoppingCartPage></ShoppingCartPage>}
              />
              <Route path="account" element={<ChangePasswordPage />} />
            </>
          ) : (
            <></>
          )}
          {user.role === Role.ADMIN ? (
            <>
              <Route path="calendar" element={<PlannerPage></PlannerPage>} />
              <Route path="users" element={<UsersPage></UsersPage>} />
              <Route path="students" element={<StudentsPage></StudentsPage>} />
              <Route
                path="orders"
                element={<OrderHistoryPage></OrderHistoryPage>}
              />
              <Route path="account" element={<AdminSettingsPage />} />
              <Route path="years" element={<SchoolYearsPage />} />
            </>
          ) : (
            <></>
          )}

          {user.role === Role.CAFETERIA ? (
            <>
              <Route path="calendar" element={<CalendarPage></CalendarPage>} />
              <Route path="account" element={<ChangePasswordPage />} />
            </>
          ) : (
            <></>
          )}

          {user.role === Role.TEACHER ? (
            <>
              <Route path="calendar" element={<CalendarPage></CalendarPage>} />
              <Route path="account" element={<ChangePasswordPage />} />
            </>
          ) : (
            <></>
          )}

          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
