import { LoginResponse } from "../components/LoginPanel";
import Menu, { DailyMenu, PantryItem } from "../models/Menu";
import { Order } from "../models/Order";
import { Notification } from "../models/Notification";
import SessionInfo from "../models/SessionInfo";
import axios, { AxiosResponse } from "axios";
import School from "../models/School";
import { ShoppingCart } from "../models/ShoppingCart";
import User from "../models/User";
import Student from "../models/Student";
import { StudentLunchTime } from "../models/StudentLunchTime";

const API_BASE_URL = "/api";

export const http = axios.create();

export const fetchSessionInfo = async () => {
    const response = await http.get(API_BASE_URL + "/session");
    const sessionInfo: SessionInfo = response.data;
    return sessionInfo;
};

export const register = async (username: string, password: string) => {
  try {
    await http.post(
      API_BASE_URL + "/register",
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
      API_BASE_URL + "/forgotpassword",
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
      API_BASE_URL + "/resetpassword",
      null,
      getRequestConfig({ username, verificationCode, password })
    );
    return true;
  } catch {
    return false;
  }
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string,
) => {
  await http.put(
    API_BASE_URL + "/login/pwd",
    {oldPassword, newPassword}
  );
};

const getRequestConfig = (params: object) => {
  return { params: params };
};

export const createPantryItem = async (pantryItem: PantryItem) => {
  const response: AxiosResponse<PantryItem> = await http.post(
    API_BASE_URL + "/pantry",
    pantryItem
  );
  return response.data;
};

export const createMenu = async (menu: Menu) => {
  const response: AxiosResponse<Menu> = await http.post(
    API_BASE_URL + "/menu",
    menu
  );
  return response.data;
};

export const checkout = async (
  paymentToken: string,
  shoppingCart: ShoppingCart,
  latestLunchSchedule: StudentLunchTime[]
) => {
  const response: AxiosResponse<Order> = await http.post(
    API_BASE_URL + "/order",
    { paymentToken, shoppingCart, latestLunchSchedule }
  );
  return response.data;
};

export const createUser = async (user: User) => {
  const response: AxiosResponse<User> = await http.post(
    API_BASE_URL + "/user",
    user
  );
  return response.data;
};

export const createStudent = async (student: Student) => {
  const response: AxiosResponse<Student> = await http.post(
    API_BASE_URL + "/student",
    student
  );
  return response.data;
};

export const updateUser = async (user: User) => {
  const response: AxiosResponse<User> = await http.put(
    API_BASE_URL + "/user",
    user
  );
  return response.data;
};

export const createNofication = async (notification: Notification) => {
  const response: AxiosResponse<Notification> = await http.post(
    API_BASE_URL + "/notification",
    notification
  );
  return response.data;
};

export const updateNotification = async (notification: Notification) => {
  const response: AxiosResponse<Notification> = await http.put(
    API_BASE_URL + "/notification",
    notification
  );
  return response.data;
};

export const updateNotificationReviewDate = async () => {
  const response: AxiosResponse<Notification> = await http.put(
    API_BASE_URL + "/notification/review"
  );
  return response.data;
};

export const updateSchoolSettings = async (schoolSettings: School) => {
  const response: AxiosResponse<Notification> = await http.put(
    API_BASE_URL + "/schoolsettings",
    schoolSettings
  );
  return response.data;
};

export const saveDailyMenu = async (menu: DailyMenu) => {
  const response: AxiosResponse<DailyMenu> = await http.post(
    API_BASE_URL + "/dailymenu",
    menu
  );
  return response.data;
};

export const updateMenu = async (menu: Menu) => {
  const response: AxiosResponse<Menu> = await http.put(
    API_BASE_URL + "/menu",
    menu
  );
  return response.data;
};

export const updateDailyMenu = async (menu: DailyMenu) => {
  const response: AxiosResponse<DailyMenu> = await http.put(
    API_BASE_URL + "/dailymenu",
    menu
  );
  return response.data;
};

export const updateDailyMenuAvailability = async (
  menu: DailyMenu,
  startDate: Date,
  endDate: Date
) => {
  const response: AxiosResponse<DailyMenu> = await http.put(
    API_BASE_URL + "/dailymenu/availability",
    {
      dailyMenuId: menu.id,
      startDateTime: startDate.toJSON(),
      endDateTime: endDate.toJSON(),
    }
  );
  return response.data;
};

export const deletePantryItem = async (id: number) => {
  await http.delete(API_BASE_URL + "/pantry/" + id);
  return;
};

export const deleteNotification = async (id: number) => {
  await http.delete(API_BASE_URL + "/notification/" + id);
  return;
};

export const deleteMenu = async (id: number) => {
  await http.delete(API_BASE_URL + "/menu/" + id);
  return;
};

export const deleteDailyMenu = async (id: number) => {
  await http.delete(API_BASE_URL + "/dailymenu/" + id);
  return;
};

export const login = async (username: string, pwd: string) => {
  const response = await http.post(API_BASE_URL + "/login", {
    username,
    pwd,
  });
  return response.data as LoginResponse;
};
