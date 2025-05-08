import { LoginResponse } from "../components/users/LoginPanel";
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
import { CreditCard } from "../models/CreditCard";
import { GiftCard } from "../models/GiftCard";

const API_BASE_URL = "/api";

export const http = axios.create();

interface SavedCards {
  creditCards: CreditCard[];
  giftCards: GiftCard[];
}

export const fetchSessionInfo = async () => {
  const response = await http.get(API_BASE_URL + "/session");
  const sessionInfo: SessionInfo = response.data;
  return sessionInfo;
};

export const getInvitation = async (invitationId: string) => {
  const response: AxiosResponse<{ user: User | null; students: Student[] }> =
    await http.get(API_BASE_URL + "/user/invite/" + invitationId);
  return response.data;
};

export const acceptInvitation = async (invitationId: string) => {
  const response: AxiosResponse<Student[]> = await http.put(
    API_BASE_URL + "/user/accept/" + invitationId
  );
  return response.data;
};

export const sendInvitation = async (
  firstName: string,
  lastName: string,
  email: string,
  role: number
) => {
  const response: AxiosResponse<User> = await http.post(
    API_BASE_URL + "/user/invite",
    { firstName, lastName, email, role }
  );
  return response.data;
};

export const register = async (
  invitationId: string,
  username: string,
  firstName: string,
  lastName: string,
  pwd: string,
  email: string
) => {
  const response: AxiosResponse<LoginResponse> = await http.post(
    API_BASE_URL + "/user/register/" + invitationId,
    { username, firstName, lastName, pwd, email }
  );
  return response.data;
};

export const forgotPassword = async (username: string) => {
  await http.post(API_BASE_URL + "/login/forgot/pwd", { username });
};

export const forgotUserName = async (email: string) => {
  await http.post(API_BASE_URL + "/login/forgot/username", { email });
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
  newPassword: string
) => {
  await http.put(API_BASE_URL + "/login/pwd", { oldPassword, newPassword });
};

export const changeForgottenPassword = async (
  forgottenPwdId: string,
  userName: string,
  pwd: string
) => {
  await http.put(API_BASE_URL + "/login/forgottenpwd", {
    forgottenPwdId,
    userName,
    pwd,
  });
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

export const getSavedCards = async () => {
  const response: AxiosResponse<SavedCards> = await http.get(
    API_BASE_URL + "/user/cards"
  );
  return response.data;
};

export const checkout = async (
  cardId: string,
  shoppingCart: ShoppingCart,
  latestLunchSchedule: StudentLunchTime[],
  saveCard: boolean
) => {
  const response: AxiosResponse<Order> = await http.post(
    API_BASE_URL + "/order",
    { cardId, shoppingCart, latestLunchSchedule, saveCard }
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

export const updateStudent = async (student: Student) => {
  const response: AxiosResponse<Student> = await http.put(
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
