import {
  Column,
  Entity,
  Index,
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

@Entity("user")
export default class UserEntity extends User {
  @PrimaryGeneratedColumn()
  id: number;
  @Index()
  @Column()
  userName: string;
  @Column()
  pwd: string;
  @Column()
  name: string;
  @Column()
  description: string;
  @Column({ type: "enum", enum: Role })
  role: Role;
  @Column({ default: "2024-01-01 00:00:00" })
  notificationReviewDate: Date;

  @OneToMany(() => OrderEntity, (order) => order.user)
  orders: OrderEntity[];

  @OneToMany(() => StudentEntity, (student) => student.parent)
  children: StudentEntity[];

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
