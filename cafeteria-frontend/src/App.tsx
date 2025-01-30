import * as React from "react";
import CalendarPage from "./CalendarPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainAppPanel, {
  ACCOUNT_URL,
  LOGIN_URL,
  MEALS_URL,
  CALENDAR_URL,
} from "./MainAppPanel";
import ShoppingCartPage from "./ShoppingCartPage";
import OrderedMealsPage from "./OrderedMealsPage";
import { useContext } from "react";
import { AppContext } from "./AppContextProvider";
import LoginPanel from "./components/LoginPanel";
import { Role } from "./models/User";
import NotificationsPage from "./NotificationsPage";
import AdminSettingsPage from "./AdminSettingsPage";
import OrderHistoryPage from "./components/OrderHistoryPage";
import PlannerPage from "./PlannerPage";
import UsersPage from "./UsersPage";
import OrderHistory from "./components/OrderHistory";

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
        <Route
          path="/login"
          element={
            user.id ? <Navigate to={defaultUrl} replace /> : <LoginPanel />
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
              <Route
                path="calendar"
                element={<CalendarPage></CalendarPage>}
              />
              <Route path="meals" element={<OrderedMealsPage></OrderedMealsPage>} />
              <Route path="orders" element={<OrderHistory></OrderHistory>} />
              <Route
                path="cart"
                element={<ShoppingCartPage></ShoppingCartPage>}
              />
            </>
          ) : (
            <></>
          )}
          {user.role === Role.ADMIN ? (
            <>
              <Route path="calendar" element={<PlannerPage></PlannerPage>} />
              <Route path="users" element={<UsersPage></UsersPage>} />
              <Route
                path="orders"
                element={<OrderHistoryPage></OrderHistoryPage>}
              />
            </>
          ) : (
            <></>
          )}

          {user.role === Role.CAFETERIA ? (
            <>
              <Route
                path="calendar"
                element={<CalendarPage></CalendarPage>}
              />
            </>
          ) : (
            <></>
          )}

          {user.role === Role.TEACHER ? (
            <>
              <Route
                path="calendar"
                element={<CalendarPage></CalendarPage>}
              />
            </>
          ) : (
            <></>
          )}
          <Route path="account" element={<AdminSettingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
