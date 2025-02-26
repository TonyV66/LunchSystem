import Menu, { DailyMenu, PantryItem } from "./Menu";
import { Order } from "./Order";
import Student from "./Student";
import User from "./User";
import { Notification } from "./Notification";
import School from "./School";
import SchoolYear from "./SchoolYear";

export default interface SessionInfo {
  users: User[];
  user: User;
  menus: Menu[];
  students: Student[];
  orders: Order[];
  scheduledMenus: DailyMenu[];
  pantryItems: PantryItem[];
  notifications: Notification[];
  schoolSettings: School;
  schoolYear: SchoolYear;
}
