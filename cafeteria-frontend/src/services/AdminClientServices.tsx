import { LoginResponse } from "../components/LoginPanel";
import Menu, { DailyMenu, PantryItem } from "../models/Menu";
import { Order } from "../models/Order";
import { Notification } from "../models/Notification";
import SessionInfo from "../models/SessionInfo";
import axios, { AxiosResponse } from "axios";
import SystemDefaults from "../models/SystemDefaults";
import { ShoppingCart } from "../models/ShoppingCart";

const PUBLIC_API_URL = "";
const ADMIN_API_URL = "";

export const http = axios.create();

export const fetchSessionInfo = async () => {
  try {
    const response = await http.get(PUBLIC_API_URL + "/session");
    const sessionInfo: SessionInfo = response.data;
    return sessionInfo;
  } catch (msg) {
    console.log(msg);
    return null;
  }
};

export const register = async (username: string, password: string) => {
  try {
    await http.post(
      PUBLIC_API_URL + "/register",
      null,
      getRequestConfig({ username, password })
    );
    return true;
  } catch {
    return false;
  }
};

export const forgotPassword = async (username: string) => {
  try {
    await http.post(
      PUBLIC_API_URL + "/forgotpassword",
      null,
      getRequestConfig({ username })
    );
    return true;
  } catch {
    return false;
  }
};

export const resetPassword = async (
  verificationCode: string,
  username: string,
  password: string
) => {
  try {
    await http.post(
      PUBLIC_API_URL + "/resetpassword",
      null,
      getRequestConfig({ username, verificationCode, password })
    );
    return true;
  } catch {
    return false;
  }
};

const getRequestConfig = (params: object) => {
  return { params: params };
};

export const createPantryItem = async (pantryItem: PantryItem) => {
  const response: AxiosResponse<PantryItem> = await axios.post(
    ADMIN_API_URL + "/pantry",
    pantryItem
  );
  return response.data;
};

export const createMenu = async (menu: Menu) => {
  const response: AxiosResponse<Menu> = await axios.post(
    ADMIN_API_URL + "/menu",
    menu
  );
  return response.data;
};

export const checkout = async (paymentToken: string, shoppingCart: ShoppingCart) => {
  const response: AxiosResponse<Order> = await http.post(
    ADMIN_API_URL + "/order",
    {paymentToken, shoppingCart}
  );
  return response.data;
};

export const createNofication = async (notification: Notification) => {
  const response: AxiosResponse<Notification> = await http.post(
    ADMIN_API_URL + "/notification",
    notification
  );
  return response.data;
};

export const updateNotification = async (notification: Notification) => {
  const response: AxiosResponse<Notification> = await http.put(
    ADMIN_API_URL + "/notification",
    notification
  );
  return response.data;
};

export const updateNotificationReviewDate = async () => {
  const response: AxiosResponse<Notification> = await http.put(
    ADMIN_API_URL + "/notification/review"
  );
  return response.data;
};

export const updateSystemDefaults = async (systemDefaults: SystemDefaults) => {
  const response: AxiosResponse<Notification> = await http.put(
    ADMIN_API_URL + "/sysdefaults",
    systemDefaults
  );
  return response.data;
};

export const saveDailyMenu = async (menu: DailyMenu) => {
  const response: AxiosResponse<DailyMenu> = await axios.post(
    ADMIN_API_URL + "/dailymenu",
    menu
  );
  return response.data;
};

export const updateMenu = async (menu: Menu) => {
  const response: AxiosResponse<Menu> = await axios.put(
    ADMIN_API_URL + "/menu",
    menu
  );
  return response.data;
};

export const updateDailyMenu = async (menu: DailyMenu) => {
  const response: AxiosResponse<DailyMenu> = await axios.put(
    ADMIN_API_URL + "/dailymenu",
    menu
  );
  return response.data;
};

export const updateDailyMenuAvailability = async (
  menu: DailyMenu,
  startDate: Date,
  endDate: Date
) => {
  const response: AxiosResponse<DailyMenu> = await axios.put(
    ADMIN_API_URL + "/dailymenu/availability",
    {
      dailyMenuId: menu.id,
      startDateTime: startDate.toJSON(),
      endDateTime: endDate.toJSON(),
    }
  );
  return response.data;
};

export const deletePantryItem = async (id: number) => {
  await axios.delete(ADMIN_API_URL + "/pantry/" + id);
  return;
};

export const deleteNotification = async (id: number) => {
  await axios.delete(ADMIN_API_URL + "/notification/" + id);
  return;
};

export const deleteMenu = async (id: number) => {
  await axios.delete(ADMIN_API_URL + "/menu/" + id);
  return;
};

export const deleteDailyMenu = async (id: number) => {
  await axios.delete(ADMIN_API_URL + "/dailymenu/" + id);
  return;
};

export const login = async (username: string, pwd: string) => {
  try {
    const response = await http.post(PUBLIC_API_URL + "/login", {
      username,
      pwd,
    });
    return response.data as LoginResponse;
  } catch (msg) {
    console.log(msg);
  }
};
