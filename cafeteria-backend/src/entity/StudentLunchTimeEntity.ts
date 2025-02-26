import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DayOfWeek } from "../models/DailyLunchTime";
import UserEntity from "./UserEntity";
import SchoolYearEntity from "./SchoolYearEntity";
import StudentEntity from "./StudentEntity";

@Entity("student_lunch_time")
export default class StudentLunchTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: "enum", enum: DayOfWeek })
  dayOfWeek: number;
  @Column()
  time: string;

  @ManyToOne(
    () => SchoolYearEntity,
    (schoolYear) => schoolYear.studentLunchTimes
  )
  schoolYear: SchoolYearEntity;

  @ManyToOne(() => UserEntity, (teacher) => teacher.studentLunchTimes, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  lunchtimeTeacher: UserEntity;

  @ManyToOne(() => StudentEntity, (student) => student.lunchTimes, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  student: StudentEntity;
}
