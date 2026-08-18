import { LoginResponse } from "../components/users/LoginPanel";
import Menu from "../models/Menu";
import DailyMenu from "../models/DailyMenu";
import PantryItem from "../models/PantryItem";
import Ingredient from "../models/Ingredient";
import UnitOfMeasure from "../models/UnitOfMeasure";
import CalendarNote from "../models/CalendarNote";
import { Order } from "../models/Order";
import { Notification } from "../models/Notification";
import SessionInfo from "../models/SessionInfo";
import axios, { AxiosResponse } from "axios";
import School from "../models/School";
import { ShoppingCart } from "../models/ShoppingCart";
import User from "../models/User";
import SchoolUser from "../models/SchoolUser";
import Student from "../models/Student";
import { StudentLunchTime } from "../models/StudentLunchTime";
import { CreditCard } from "../models/CreditCard";
import { GiftCard } from "../models/GiftCard";
import SchoolYear from "../models/SchoolYear";
import DailyLunchTimes from "../models/DailyLunchTimes";
import { GradeLevel } from "../models/GradeLevel";
import GradeLunchTime from "../models/GradeLunchTime";
import TeacherLunchTime from "../models/TeacherLunchTime";
import { Survey } from "../models/Survey";
import { QuestionRequest } from "../models/Question";

const API_BASE_URL = "/api";

export interface Relations {
  students: Student[];
  parents: SchoolUser[];
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

export interface CreateSchoolYearResponse {
  schoolYear: SchoolYear;
  jobId: string | null;
}

export interface FactsJobStartResponse {
  jobId: string;
}

export interface FactsJobStatusResponse {
  id: string;
  status: "running" | "complete" | "failed";
  message: string;
  schoolYearId?: number;
}

export const pollFactsJob = async (
  jobId: string,
  onProgress: (message: string) => void,
  intervalMs = 1500,
): Promise<FactsJobStatusResponse> => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response: AxiosResponse<FactsJobStatusResponse> = await http.get(
      `${API_BASE_URL}/schoolyear/jobs/${jobId}`,
    );
    const job = response.data;
    onProgress(job.message);
    if (job.status !== "running") {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
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

export const replaceTeacher = async (schoolYearId: number, teacherId: number, newTeacherId: number) => {
  const response: AxiosResponse<Student> = await http.post(
    API_BASE_URL +
      "/schoolyear/" +
      schoolYearId +
      "/teacher/" +
      teacherId +
      "/replacewith/" +
      newTeacherId,
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
  userName?: string,
  pwd?: string
) => {
  const response: AxiosResponse<SchoolUser> = await http.post(
    API_BASE_URL + "/user/invite",
    { firstName, lastName, email, role, userName, pwd }
  );
  return response.data;
};

export const registerParent = async (registration: {
  username: string;
  schoolRegistrationCode?: string;
}) => {
  await http.post(API_BASE_URL + "/register/parent", registration);
};

export interface InvitationDetails {
  invitationId: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  needsUserName: boolean;
}

export const getInvitationDetails = async (invitationId: string) => {
  const response: AxiosResponse<InvitationDetails> = await http.get(
    API_BASE_URL + "/register/invitation/" + invitationId
  );
  return response.data;
};

export const completeParentRegistration = async (registration: {
  invitationId: string;
  userName?: string;
  firstName: string;
  lastName: string;
  pwd: string;
}) => {
  await http.post(API_BASE_URL + "/register/parent/complete", registration);
};

export const verifyAccountForPasswordReset = async (username: string) => {
  const response: AxiosResponse<{
    exists: boolean;
    hasPassword: boolean;
    allInactive: boolean;
    allActive: boolean;
    isFactsRegistrationPending: boolean;
  }> = await http.post(API_BASE_URL + "/login/pwd/verify", { username });
  return response.data;
};

export const forgotPassword = async (username: string) => {
  await http.post(API_BASE_URL + "/login/pwd/forgot", { username });
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

export const updatePantryItem = async (pantryItem: PantryItem) => {
  const response: AxiosResponse<PantryItem> = await http.put(
    API_BASE_URL + "/pantry",
    pantryItem
  );
  return response.data;
};

export const createIngredient = async (name: string) => {
  const response: AxiosResponse<Ingredient> = await http.post(
    API_BASE_URL + "/ingredient",
    { name }
  );
  return response.data;
};

export const createUnitOfMeasure = async (name: string) => {
  const response: AxiosResponse<UnitOfMeasure> = await http.post(
    API_BASE_URL + "/unit-of-measure",
    { name }
  );
  return response.data;
};

export const saveCalendarNote = async (calendarNote: CalendarNote) => {
  const response: AxiosResponse<CalendarNote> = await http.post(
    API_BASE_URL + "/calendar-note",
    { date: calendarNote.date, note: calendarNote.note }
  );
  return response.data;
};

export const deleteCalendarNote = async (id: number) => {
  await http.delete(API_BASE_URL + "/calendar-note/" + id);
  return;
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
  useCredits: boolean,
  cardId: string,
  shoppingCart: ShoppingCart,
  saveCard: boolean,
  emailReceipt: boolean,
) => {
  const response: AxiosResponse<Order> = await http.post(
    API_BASE_URL + "/order",
    { cardId, shoppingCart, saveCard, useCredits, emailReceipt }
  );
  return response.data;
};

export const cancelOrder = async (orderId: number, issueCredits: boolean) => {
  const response: AxiosResponse<{order: Order, availableCredits: number}> = await http.put(
    API_BASE_URL + `/order/${orderId}/cancel`,
    { issueCredits }
  );
  return response.data;
};

export const cancelMeal = async (mealId: number, issueCredits: boolean) => {
  const response: AxiosResponse<{order: Order, availableCredits: number}> = await http.put(
    API_BASE_URL + `/meal/${mealId}/cancel`,
    { issueCredits }
  );
  return response.data;
};

export const fetchOrdersByMealDate = async (date: string) => {
  const response: AxiosResponse<Order[]> = await http.get(
    API_BASE_URL + "/meal",
    { params: { date } },
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
    parents: SchoolUser[];
    orders: Order[];
  }> = await http.put(
    API_BASE_URL + "/student/" + studentId + "/associate/" + userId
  );
  return response.data;
};

export interface UpdateUserRequest extends User {
  role: number;
  accountStatus: string;
  availableCredits: number;
  surveyCompleted: boolean;
  factsId: number | null;
}

// TODO: What is this function used for?
export const updateUser = async (user: UpdateUserRequest) => {
  const response: AxiosResponse<SchoolUser> = await http.put(
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

export const archivePantryItem = async (id: number) => {
  const response: AxiosResponse<PantryItem> = await http.delete(
    API_BASE_URL + "/pantry/" + id
  );
  return response.data;
};

export const unarchivePantryItem = async (id: number) => {
  const response: AxiosResponse<PantryItem> = await http.put(
    API_BASE_URL + "/pantry/" + id + "/unarchive"
  );
  return response.data;
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

export const createSchoolYear = async (
  schoolYear: SchoolYear,
): Promise<CreateSchoolYearResponse> => {
  const response: AxiosResponse<CreateSchoolYearResponse> = await http.post(
    API_BASE_URL + "/schoolyear",
    schoolYear,
  );
  return response.data;
};

export const fetchFactsSchoolYears = async () => {
  const response: AxiosResponse<SchoolYear[]> = await http.get(
    API_BASE_URL + "/schoolyear/facts",
  );
  return response.data;
};

export const synchronizeSchoolYear = async (
  schoolYearId: number,
): Promise<FactsJobStartResponse> => {
  const response: AxiosResponse<FactsJobStartResponse> = await http.post(
    `${API_BASE_URL}/schoolyear/${schoolYearId}/synchronize`,
  );
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

export interface UserChildEnrollment {
  student: Student;
  enrolled: boolean;
}

export const getUserEnrollmentHistory = async (
  userId: number,
): Promise<UserChildEnrollment[]> => {
  const response: AxiosResponse<UserChildEnrollment[]> = await http.get(
    `${API_BASE_URL}/user/${userId}/enrollments`,
  );
  return response.data;
};

export const updateUserEnrollments = async (
  userId: number,
  enrollments: Array<{ studentId: number; enrolled: boolean }>,
): Promise<UserChildEnrollment[]> => {
  const response: AxiosResponse<UserChildEnrollment[]> = await http.put(
    `${API_BASE_URL}/user/${userId}/enrollments`,
    { enrollments },
  );
  return response.data;
};

export interface StudentParentEnrollment {
  user: SchoolUser;
  enrolled: boolean;
}

export const getStudentEnrollmentHistory = async (
  studentId: number,
): Promise<StudentParentEnrollment[]> => {
  const response: AxiosResponse<StudentParentEnrollment[]> = await http.get(
    `${API_BASE_URL}/student/${studentId}/enrollments`,
  );
  return response.data;
};

export const updateStudentEnrollments = async (
  studentId: number,
  enrollments: Array<{ userId: number; enrolled: boolean }>,
): Promise<StudentParentEnrollment[]> => {
  const response: AxiosResponse<StudentParentEnrollment[]> = await http.put(
    `${API_BASE_URL}/student/${studentId}/enrollments`,
    { enrollments },
  );
  return response.data;
};

export interface StaffImportResult {
  createdUsersCount: number;
  updatedUsersCount: number;
  unchangedUsersCount: number;
  rowErrors: Array<{ row: number; message: string }>;
}

export const importStaffCsv = async (
  file: File,
): Promise<StaffImportResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const response: AxiosResponse<StaffImportResult> = await http.post(
    `${API_BASE_URL}/user/import-staff-csv`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export interface StudentImportResult {
  createdUsersCount: number;
  createdStudentsCount: number;
  matchedStudentsCount: number;
  enrollmentLinksCount: number;
  rowErrors: Array<{ row: number; message: string }>;
}

export const importStudentsCsv = async (
  file: File,
): Promise<StudentImportResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const response: AxiosResponse<StudentImportResult> = await http.post(
    `${API_BASE_URL}/user/import-students-csv`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const startSurvey = async (questions: QuestionRequest[]): Promise<Survey> => {
  const response: AxiosResponse<Survey> = await http.post(API_BASE_URL + "/survey/start", questions);
  return response.data;
};

export const endSurvey = async (): Promise<Survey> => {
  const response: AxiosResponse<Survey> = await http.put(
    API_BASE_URL + "/survey/end",
  );
  return response.data;
};

export const getSurvey = async (): Promise<Survey> => {
  const response: AxiosResponse<Survey> = await http.get(API_BASE_URL + "/survey");
  return response.data;
};

export const submitSurvey = async (
  ratings: number[],
  comment?: string
): Promise<void> => {
  await http.post(API_BASE_URL + "/survey/submit", {
    ratings,
    comment: comment?.trim() || undefined,
  });
};
