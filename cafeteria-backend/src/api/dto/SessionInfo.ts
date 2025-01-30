import { PantryItem } from "../../models/Menu";
import MenuDTO, { DailyMenuDTO } from "./MenuDTO";
import { OrderDTO } from "./OrderDTO";
import StudentDTO from "./StudentDTO";
import UserDTO from "./UserDTO";
import { Notification } from "../../models/Notification";
import SystemDefaultsEntity from "../../entity/SystemDefaultsEntity";

export default interface SessionInfo {
  user: UserDTO;
  menus: MenuDTO[];
  users: UserDTO[];
  students: StudentDTO[];
  orders: OrderDTO[];
  scheduledMenus: DailyMenuDTO[];
  pantryItems: PantryItem[];
  notifications: Notification[];
  systemDefaults: SystemDefaultsEntity;
}
