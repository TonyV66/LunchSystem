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
import SchoolEntity from "./entity/SchoolEntity";
import SchoolYearEntity from "./entity/SchoolYearEntity";
import SchoolLunchTimeEntity from "./entity/SchoolLunchTimeEntity";
import TeacherLunchTimeEntity from "./entity/TeacherLunchTimeEntity";
import StudentLunchTimeEntity from "./entity/StudentLunchTimeEntity";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
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
    SchoolEntity,
    SchoolYearEntity,
    SchoolLunchTimeEntity,
    TeacherLunchTimeEntity,
    StudentLunchTimeEntity,
  ],
  migrations: [],
  subscribers: [],
});
