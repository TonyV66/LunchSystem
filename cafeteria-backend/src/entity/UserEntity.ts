import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { OrderEntity } from "./OrderEntity";
import TeacherLunchTimeEntity from "./TeacherLunchTimeEntity";
import StudentLunchTimeEntity from "./StudentLunchTimeEntity";
import MealEntity from "./MealEntity";
import UserStatusEntity from "./UserStatusEntity";
import EnrollmentEntity from "./EnrollmentEntity";

@Entity("user")
export default class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Index({ unique: true })
  @Column()
  userName: string;
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

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.user)
  enrollments: EnrollmentEntity[];

  @OneToMany(() => TeacherLunchTimeEntity, (lunchTime) => lunchTime.teacher, {
    cascade: true,
  })
  lunchTimes: TeacherLunchTimeEntity[];

  @OneToMany(() => StudentLunchTimeEntity, (lunchTime) => lunchTime.lunchtimeTeacher, {
    cascade: true,
  })
  studentLunchTimes: StudentLunchTimeEntity[];

  @OneToMany(
    () => UserStatusEntity,
    (registration) => registration.user,
  )
  userStatuses: UserStatusEntity[];
}
