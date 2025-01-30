import Menu, { DailyMenu, PantryItem } from "./Menu";
import { Order } from "./Order";
import Student from "./Student";
import User from "./User";
import { Notification } from "./Notification";
import SystemDefaults from "./SystemDefaults";

export default interface SessionInfo {
  users: User[];
  user: User;
  menus: Menu[];
  students: Student[];
  orders: Order[];
  scheduledMenus: DailyMenu[];
  pantryItems: PantryItem[];
  notifications: Notification[];
  systemDefaults: SystemDefaults;
}
