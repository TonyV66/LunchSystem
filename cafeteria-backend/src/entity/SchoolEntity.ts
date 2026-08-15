import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import NotificationEntity from "./NotificationEntity";
import MenuEntity from "./MenuEntity";
import PantryItemEntity from "./PantryItemEntity";
import IngredientEntity from "./IngredientEntity";
import UnitOfMeasureEntity from "./UnitOfMeasureEntity";
import SchoolYearEntity from "./SchoolYearEntity";
import { DecimalTransformer } from "./DecimalTransformer";
import StudentEntity from "./StudentEntity";
import SurveyEntity from "./SurveyEntity";
import CalendarNoteEntity from "./CalendarNoteEntity";
import UserStatusEntity from "./UserStatusEntity";
import SchoolDistrictEntity from "./SchoolDistrictEntity";

@Entity("school")
export default class SchoolEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  registrationCode: string;
  @Column({default: true})
  openRegistration: boolean;
  @Column()
  orderStartPeriodCount: number;
  @Column()
  orderStartRelativeTo: number;
  @Column()
  orderStartTime: string;
  @Column()
  orderEndPeriodCount: number;
  @Column()
  orderEndRelativeTo: number;
  @Column()
  orderEndTime: string;
  @Column()
  emailReportStartPeriodCount: number;
  @Column()
  emailReportStartPeriodType: number;
  @Column()
  emailReportStartRelativeTo: number;
  @Column()
  emailReportStartTime: string;
  @Column({default: "America/New_York"})
  timezone: string;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  mealPrice: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  drinkOnlyPrice: number;
  @Column()
  squareAppId: string;
  @Column()
  squareAppAccessToken: string;
  @Column()
  squareLocationId: string;
  @Column({ default: "" })
  factsApiKey: string;

  @ManyToOne(() => SchoolDistrictEntity, (district) => district.schools, {
    nullable: true,
    onDelete: "SET NULL",
  })
  schoolDistrict: SchoolDistrictEntity | null;

  @OneToMany(() => UserStatusEntity, (registration) => registration.school)
  userStatuses: UserStatusEntity[];
  @OneToMany(() => StudentEntity, (student) => student.school)
  students: StudentEntity[];
  @OneToMany(() => NotificationEntity, (notification) => notification.school)
  notifications: NotificationEntity[];
  @OneToMany(() => PantryItemEntity, (pantryItem) => pantryItem.school)
  pantry: PantryItemEntity[];
  @OneToMany(() => IngredientEntity, (ingredient) => ingredient.school)
  ingredients: IngredientEntity[];
  @OneToMany(() => UnitOfMeasureEntity, (unitOfMeasure) => unitOfMeasure.school)
  unitsOfMeasure: UnitOfMeasureEntity[];
  @OneToMany(() => SchoolYearEntity, (schoolYear) => schoolYear.school)
  schoolYears: SchoolYearEntity[];
  @OneToMany(() => MenuEntity, (menu) => menu.school)
  menus: MenuEntity[];
  @OneToMany(() => CalendarNoteEntity, (calendarNote) => calendarNote.school)
  calendarNotes: CalendarNoteEntity[];
  @OneToOne(() => SurveyEntity, (survey) => survey.school)
  survey: SurveyEntity;
}
