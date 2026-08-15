import Menu from "./Menu";
import DailyMenu from "./DailyMenu";
import PantryItem from "./PantryItem";
import Ingredient from "./Ingredient";
import UnitOfMeasure from "./UnitOfMeasure";
import CalendarNote from "./CalendarNote";
import { Order } from "./Order";
import Student from "./Student";
import SchoolUser from "./SchoolUser";
import { Notification } from "./Notification";
import School from "./School";
import SchoolYear from "./SchoolYear";
import { Survey } from "./Survey";

export default interface SessionInfo {
  users: SchoolUser[];
  user: SchoolUser;
  menus: Menu[];
  schoolYears: SchoolYear[];
  students: Student[];
  orders: Order[];
  scheduledMenus: DailyMenu[];
  pantryItems: PantryItem[];
  ingredients: Ingredient[];
  unitsOfMeasure: UnitOfMeasure[];
  notifications: Notification[];
  calendarNotes: CalendarNote[];
  school: School;
  survey: Survey | null;
}
