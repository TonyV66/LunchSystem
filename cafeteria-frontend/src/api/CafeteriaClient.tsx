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
import SchoolYear from "../models/SchoolYear";
import DailyLunchTimes from "../models/DailyLunchTimes";
import { GradeLevel } from "../models/GradeLevel";
import GradeLunchTime from "../models/GradeLunchTime";
import TeacherLunchTime from "../models/TeacherLunchTime";

const API_BASE_URL = "/api";
export const REPORTS_BASE_URL = "http://localhost:4000/reports";

export const showClassroomReport = (date: string, teacherId: number) => {
  const newWindow = window.open(
    REPORTS_BASE_URL + "/classroom/" + teacherId + "/" + date,
    "_blank",
    "noopener,noreferrer"
  );
  if (newWindow) newWindow.opener = null;
};

export const showGradeReport = (date: string, grade: GradeLevel) => {
  const newWindow = window.open(
    REPORTS_BASE_URL + "/grade/" + grade + "/" + date,
    "_blank",
    "noopener,noreferrer"
  );
  if (newWindow) newWindow.opener = null;
};

export const showAdminReport = (date: string) => {
  const newWindow = window.open(
    REPORTS_BASE_URL + "/cohorts/" + date,
    "_blank",
    "noopener,noreferrer"
  );
  if (newWindow) newWindow.opener = null;
};

export const showDailyCafeteriaReport = (date: string) => {
  const newWindow = window.open(
    REPORTS_BASE_URL + "/cafeteria/" + date,
    "_blank",
    "noopener,noreferrer"
  );
  if (newWindow) newWindow.opener = null;
};

export interface Relations {
  students: Student[];
  parents: User[];
  studentLunchTimes: StudentLunchTime[];
}

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

export const saveSchoolYearLunchTimes = async (
  schoolYearId: string,
  dailyLunchTimes: DailyLunchTimes
) => {
  const response: AxiosResponse<DailyLunchTimes[]> = await http.post(
    API_BASE_URL + "/schoolyear/" + schoolYearId + "/times",
    [dailyLunchTimes]
  );
  return response.data;
};

export const saveGradeLunchTimes = async (
  schoolYearId: number,
  grade: GradeLevel,
  dailyLunchTimes: DailyLunchTimes[]
) => {
  const response: AxiosResponse<GradeLunchTime[]> = await http.post(
    API_BASE_URL + "/schoolyear/" + schoolYearId + "/grade/" + grade + "/times",
    dailyLunchTimes
  );
  return response.data;
};

export const saveTeacherLunchTimes = async (
  schoolYearId: string,
  teacherId: number,
  teacherLunchTimes: TeacherLunchTime[]
) => {
  const response: AxiosResponse<TeacherLunchTime[]> = await http.post(
    API_BASE_URL +
      "/schoolyear/" +
      schoolYearId +
      "/teacher/" +
      teacherId +
      "/times",
    teacherLunchTimes
  );
  return response.data;
};

export const acceptInvitation = async (invitationId: string) => {
  const response: AxiosResponse<Student[]> = await http.put(
    API_BASE_URL + "/user/accept/" + invitationId
  );
  return response.data;
};

export const createInvitation = async (
  firstName: string,
  lastName: string,
  email: string,
  role: number,
  sendInvitation: boolean = true
) => {
  const response: AxiosResponse<User> = await http.post(
    API_BASE_URL + "/user/invite",
    { firstName, lastName, email, role, sendInvitation }
  );
  return response.data;
};

export const register = async (
  schoolCode: string,
  username: string,
  firstName: string,
  lastName: string,
  pwd: string,
  email: string
) => {
  const response: AxiosResponse<LoginResponse> = await http.post(
    API_BASE_URL + "/user/register",
    { schoolCode, username, firstName, lastName, pwd, email }
  );
  return response.data;
};

export const forgotPassword = async (username: string) => {
  await http.post(API_BASE_URL + "/login/pwd/forgot", { username });
};

export const forgotUserName = async (email: string) => {
  await http.post(API_BASE_URL + "/login/forgot/username", { email });
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
  await http.put(API_BASE_URL + "/login/pwd/reset", {
    forgottenPwdId,
    userName,
    pwd,
  });
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
  saveCard: boolean
) => {
  const response: AxiosResponse<Order> = await http.post(
    API_BASE_URL + "/order",
    { cardId, shoppingCart, saveCard }
  );
  return response.data;
};

export const donate = async (shoppingCart: ShoppingCart) => {
  const response: AxiosResponse<Order> = await http.post(
    API_BASE_URL + "/order/donate",
    shoppingCart
  );
  return response.data;
};

export interface StudentWithLunchTimes extends Student {
  lunchTimes?: StudentLunchTime[];
}

export const createStudent = async (student: StudentWithLunchTimes) => {
  const response: AxiosResponse<Student> = await http.post(
    API_BASE_URL + "/student",
    student
  );
  return response.data;
};

export const getRelations = async (
  firstName: string,
  lastName: string,
  grade: GradeLevel
): Promise<Relations> => {
  const response: AxiosResponse<Relations> = await http.get(
    API_BASE_URL + "/student/relations",
    { params: { firstName, lastName, grade } }
  );
  return response.data;
};

export const testClassroomReports = async (schoolId: number, date: string) => {
  await http.post("/reports/test-email-reports/" + schoolId, { date });
  return;
};

export const updateStudent = async (student: StudentWithLunchTimes) => {
  const response: AxiosResponse<Student> = await http.put(
    API_BASE_URL + "/student",
    student
  );
  return response.data;
};

export const updateStudentLunchTimes = async (
  studentId: number,
  lunchTimes: StudentLunchTime[]
) => {
  const response: AxiosResponse<StudentLunchTime[]> = await http.put(
    API_BASE_URL + "/student/" + studentId + "/lunchtimes",
    lunchTimes
  );
  return response.data;
};

export const associateStudentWithUser = async (
  studentId: number,
  userId: number
) => {
  const response: AxiosResponse<{
    student: Student;
    lunchTimes: StudentLunchTime[];
    parents: User[];
    orders: Order[];
  }> = await http.put(
    API_BASE_URL + "/student/" + studentId + "/associate/" + userId
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

export const updateSchoolOrderTimes = async (school: School) => {
  const response: AxiosResponse<Notification> = await http.put(
    API_BASE_URL + "/school/ordertimes",
    school
  );
  return response.data;
};

export const updateSchoolPrices = async (school: School) => {
  const response: AxiosResponse<Notification> = await http.put(
    API_BASE_URL + "/school/prices",
    school
  );
  return response.data;
};

export const updateSchoolEmailReports = async (school: School) => {
  const response: AxiosResponse<Notification> = await http.put(
    API_BASE_URL + "/school/emailreports",
    school
  );
  return response.data;
};

export const updateSchoolRegistration = async (school: School) => {
  const response: AxiosResponse<School> = await http.put(
    API_BASE_URL + "/school/registration",
    school
  );
  return response.data;
};

export const updateSchoolGeneral = async (school: School) => {
  const response: AxiosResponse<School> = await http.put(
    API_BASE_URL + "/school/general",
    school
  );
  return response.data;
};

export const updateSchoolSquare = async (school: School) => {
  const response: AxiosResponse<School> = await http.put(
    API_BASE_URL + "/school/square",
    school
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

export const createSchoolYear = async (schoolYear: SchoolYear) => {
  const response = await http.post(API_BASE_URL + "/schoolyear", schoolYear);
  return response.data;
};

export const updateSchoolYear = async (schoolYear: SchoolYear) => {
  const response: AxiosResponse<SchoolYear> = await http.put(
    API_BASE_URL + "/schoolyear",
    schoolYear
  );
  return response.data;
};

export const updateGradeLevelConfig = async (
  schoolYearId: number,
  gradesAssignedByClass: GradeLevel[]
) => {
  const response: AxiosResponse<SchoolYear> = await http.put(
    `${API_BASE_URL}/schoolyear/${schoolYearId.toString()}/gradeconfig`,
    gradesAssignedByClass
  );
  return response.data;
};

export const updateSchoolYearTeacherConfig = async (
  schoolYearId: number,
  oneTeacherPerStudent: boolean
) => {
  const response: AxiosResponse<SchoolYear> = await http.put(
    `${API_BASE_URL}/schoolyear/${schoolYearId.toString()}/teacher-config`,
    { oneTeacherPerStudent }
  );
  return response.data;
};

export const toggleSchoolYearCurrent = async (schoolYearId: number) => {
  const response: AxiosResponse<SessionInfo> = await http.put(
    `${API_BASE_URL}/schoolyear/${schoolYearId}/toggle-current`,
    {}
  );
  return response.data;
};

export const getStudentsForUser = async (
  userId: number
): Promise<Student[]> => {
  const response: AxiosResponse<Student[]> = await http.get(
    `${API_BASE_URL}/user/${userId}/students`
  );
  return response.data;
};

export interface UserImportResult {
  importedUsersCount: number;
  skippedUsersCount: number;
  importedStudentsCount: number;
  skippedStudentsCount: number;
}

export const uploadUserCsv = async (file: File): Promise<UserImportResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const response: AxiosResponse<UserImportResult> = await http.post(
    `${API_BASE_URL}/user/import-students`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export interface TeacherImportResult {
  importedUsersCount: number;
  skippedUsersCount: number;
}

export const importTeachers = async (
  formData: FormData
): Promise<User[]> => {
  const response: AxiosResponse<User[]> = await http.post(
    `${API_BASE_URL}/user/import-teachers`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
