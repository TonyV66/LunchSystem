import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { OrderEntity } from "./OrderEntity";
import StudentEntity from "./StudentEntity";
import User, { Role } from "../models/User";
import SchoolEntity from "./SchoolEntity";
import TeacherLunchTimeEntity from "./TeacherLunchTimeEntity";
import StudentLunchTimeEntity from "./StudentLunchTimeEntity";
import SchoolYearEntity from "./SchoolYearEntity";
import MealEntity from "./MealEntity";

@Entity("user")
export default class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({default: ''})
  externalId: string;
  @Index()
  @Column()
  userName: string;
  @Column({default: true})
  pending: boolean;
  @Column()
  pwd: string;
  @Column()
  name: string;
  @Column({ default: "" })
  firstName: string;
  @Column({ default: "" })
  lastName: string;
  @Column({ nullable: true })
  email: string;
  @Column({ default: "" })
  phone: string;
  @Column({default: ''})
  description: string;
  @Column({ nullable: false, default: Role.PARENT })
  role: Role;
  @Column({ nullable: true })
  paymentSysUserId: string;
  @Column({ default: "2024-01-01 00:00:00" })
  notificationReviewDate: Date;
  @Column({ default: false })
  resetPwd: boolean;
  @Column({ nullable: true, type: String })
  forgotPwdUri: string | null;
  @Column({ nullable: true })
  forgotPwdDate: Date;
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Index()
  creationDate: Date;
  @Column({ type: "timestamp", nullable: true })
  @Index()
  lastLoginDate: Date;
  @OneToMany(() => MealEntity, (meal) => meal.staffMember)
  meals: MealEntity[];
  @OneToMany(() => OrderEntity, (order) => order.user)
  orders: OrderEntity[];

  @ManyToMany(() => StudentEntity, (student) => student.parents)
  @JoinTable({name: 'user_students'})
  students: StudentEntity[];  

  @ManyToMany(() => SchoolYearEntity, (schoolYear => schoolYear.parents))
  schoolYears: SchoolYearEntity[];

  @OneToMany(() => TeacherLunchTimeEntity, (lunchTime) => lunchTime.teacher, {
    cascade: true,
  })
  lunchTimes: TeacherLunchTimeEntity[];

  @OneToMany(() => StudentLunchTimeEntity, (lunchTime) => lunchTime.lunchtimeTeacher, {
    cascade: true,
  })
  studentLunchTimes: StudentLunchTimeEntity[];
  
  @ManyToOne(() => SchoolEntity, (school) => school.users)
  school: SchoolEntity;
}
