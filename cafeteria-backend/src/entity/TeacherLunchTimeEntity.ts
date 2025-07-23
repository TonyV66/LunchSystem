import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DayOfWeek } from "../models/DayOfWeek";
import UserEntity from "./UserEntity";
import SchoolYearEntity from "./SchoolYearEntity";

@Entity("teacher_lunch_time")
export default class TeacherLunchTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  dayOfWeek: number;
  @Column()
  time: string;
  @Column({ default: "" })
  grades: string;

  @ManyToOne(
    () => SchoolYearEntity,
    (schoolYear) => schoolYear.teacherLunchTimes
  )
  schoolYear: SchoolYearEntity;

  @ManyToOne(() => UserEntity, (teacher) => teacher.lunchTimes, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  teacher: UserEntity;
}
