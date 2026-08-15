import "reflect-metadata";
import "./env";
import { DataSource } from "typeorm";
import MealEntity from "./entity/MealEntity";
import MenuEntity from "./entity/MenuEntity";
import MealItemEntity from "./entity/MealItemEntity";
import MenuItemEntity from "./entity/MenuItemEntity";
import DailyMenuItemEntity from "./entity/DailyMenuItemEntity";
import DailyMenuEntity from "./entity/DailyMenuEntity";
import PantryItemEntity from "./entity/PantryItemEntity";
import RecipeItemEntity from "./entity/RecipeItemEntity";
import IngredientEntity from "./entity/IngredientEntity";
import UnitOfMeasureEntity from "./entity/UnitOfMeasureEntity";
import { OrderEntity } from "./entity/OrderEntity";
import StudentEntity from "./entity/StudentEntity";
import UserEntity from "./entity/UserEntity";
import UserStatusEntity from "./entity/UserStatusEntity";
import EnrollmentEntity from "./entity/EnrollmentEntity";
import NotificationEntity from "./entity/NotificationEntity";
import SchoolEntity from "./entity/SchoolEntity";
import SchoolDistrictEntity from "./entity/SchoolDistrictEntity";
import SchoolYearEntity from "./entity/SchoolYearEntity";
import SchoolYearLunchTimeEntity from "./entity/SchoolYearLunchTimeEntity";
import TeacherLunchTimeEntity from "./entity/TeacherLunchTimeEntity";
import GradeLunchTimeEntity from "./entity/GradeLunchTimeEntity";
import StudentLunchTimeEntity from "./entity/StudentLunchTimeEntity";
import SurveyEntity from "./entity/SurveyEntity";
import QuestionEntity from "./entity/QuestionEntity";
import CalendarNoteEntity from "./entity/CalendarNoteEntity";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [
    PantryItemEntity,
    RecipeItemEntity,
    IngredientEntity,
    UnitOfMeasureEntity,
    MealEntity,
    MealItemEntity,
    MenuItemEntity,
    DailyMenuItemEntity,
    DailyMenuEntity,
    MenuEntity,
    OrderEntity,
    StudentEntity,
    UserEntity,
    UserStatusEntity,
    EnrollmentEntity,
    NotificationEntity,
    SchoolDistrictEntity,
    SchoolEntity,
    SchoolYearEntity,
    SchoolYearLunchTimeEntity,
    TeacherLunchTimeEntity,
    StudentLunchTimeEntity,
    GradeLunchTimeEntity,
    SurveyEntity,
    QuestionEntity,
    CalendarNoteEntity,
  ],
  migrations: [__dirname + "/migration/**/*.{ts,js}"],
  subscribers: [],
});
