import "reflect-metadata";
import { DataSource } from "typeorm";
import MealEntity from "./entity/MealEntity";
import MenuEntity, {
  MealItemEntity,
  MenuItemEntity,
  DailyMenuItemEntity,
  DailyMenuEntity,
  PantryItemEntity,
} from "./entity/MenuEntity";
import { OrderEntity } from "./entity/OrderEntity";
import StudentEntity from "./entity/StudentEntity";
import UserEntity from "./entity/UserEntity";
import NotificationEntity from "./entity/NotificationEntity";
import SystemDefaultsEntity from "./entity/SystemDefaultsEntity";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "jellybeanboy321",
  database: "cafeteria",
  synchronize: true,
  logging: false,
  entities: [
    PantryItemEntity,
    MealEntity,
    MealItemEntity,
    MenuItemEntity,
    DailyMenuItemEntity,
    DailyMenuEntity,
    MenuEntity,
    OrderEntity,
    StudentEntity,
    UserEntity,
    NotificationEntity,
    SystemDefaultsEntity,
  ],
  migrations: [],
  subscribers: [],
});
