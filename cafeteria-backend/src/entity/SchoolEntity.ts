import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import UserEntity from "./UserEntity";
import NotificationEntity from "./NotificationEntity";
import MenuEntity, { PantryItemEntity } from "./MenuEntity";
import SchoolYearEntity from "./SchoolYearEntity";
import { DecimalTransformer } from "./DecimalTransformer";
import StudentEntity from "./StudentEntity";

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
  orderStartPeriodType: number;
  @Column()
  orderStartRelativeTo: number;
  @Column()
  orderStartTime: string;
  @Column()
  orderEndPeriodCount: number;
  @Column()
  orderEndPeriodType: number;
  @Column()
  orderEndRelativeTo: number;
  @Column()
  orderEndTime: string;
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
  @OneToMany(() => UserEntity, (user) => user.school)
  users: UserEntity[];
  @OneToMany(() => StudentEntity, (student) => student.school)
  students: StudentEntity[];
  @OneToMany(() => NotificationEntity, (notification) => notification.school)
  notifications: NotificationEntity[];
  @OneToMany(() => PantryItemEntity, (pantryItem) => pantryItem.school)
  pantry: PantryItemEntity[];
  @OneToMany(() => SchoolYearEntity, (schoolYear) => schoolYear.school)
  schoolYears: SchoolYearEntity[];
  @OneToMany(() => MenuEntity, (menu) => menu.school)
  menus: MenuEntity[];
}
