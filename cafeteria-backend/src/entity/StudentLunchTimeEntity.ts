import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DayOfWeek } from "../models/DayOfWeek";
import UserEntity from "./UserEntity";
import SchoolYearEntity from "./SchoolYearEntity";
import StudentEntity from "./StudentEntity";
import { GradeLevel } from "../models/GradeLevel";

@Entity("student_lunch_time")
export default class StudentLunchTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: "enum", enum: DayOfWeek, nullable: false })
  dayOfWeek: number;
  @Column({ default: '' })
  time: string;
  @Column({ type: "enum", enum: GradeLevel, nullable: false })
  grade: GradeLevel;

  @ManyToOne(
    () => SchoolYearEntity,
    (schoolYear) => schoolYear.studentLunchTimes
  )
  schoolYear: SchoolYearEntity;

  @ManyToOne(() => UserEntity, (teacher) => teacher.studentLunchTimes, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
    nullable: true
  })
  lunchtimeTeacher: UserEntity | null;

  @ManyToOne(() => StudentEntity, (student) => student.lunchTimes, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  student: StudentEntity;
}
