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

@Entity("user")
export default class UserEntity extends User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({default: ''})
  externalId: string;
  @Index()
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
  @Column({ nullable: true, unique: true })
  email: string;
  @Column({default: ''})
  description: string;
  @Column({ type: "enum", enum: Role })
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

  @OneToMany(() => OrderEntity, (order) => order.user)
  orders: OrderEntity[];

  @ManyToMany(() => StudentEntity)
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
