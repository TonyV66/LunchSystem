import Menu, { DailyMenu, PantryItem } from "./Menu";
import { Order } from "./Order";
import Student from "./Student";
import User from "./User";
import { Notification } from "./Notification";
import School from "./School";
import DailyLunchTime from "./DailyLunchTime";
import TeacherLunchTime from "./TeacherLunchTime";
import { StudentLunchTime } from "./StudentLunchTime";
import SchoolYear from "./SchoolYear";

export default interface SessionInfo {
  users: User[];
  user: User;
  menus: Menu[];
  schoolYears: SchoolYear[];
  students: Student[];
  orders: Order[];
  scheduledMenus: DailyMenu[];
  pantryItems: PantryItem[];
  notifications: Notification[];
  school: School;
  schoolLunchTimes: DailyLunchTime[];
  teacherLunchTimes: TeacherLunchTime[];
  studentLunchTimes: StudentLunchTime[];
}
