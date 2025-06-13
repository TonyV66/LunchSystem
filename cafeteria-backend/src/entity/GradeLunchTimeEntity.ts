import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DayOfWeek } from "../models/DayOfWeek";
import SchoolYearEntity from "./SchoolYearEntity";
import { GradeLevel } from "../models/GradeLevel";

@Entity("grade_lunch_time")
export default class GradeLunchTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: "enum", enum: DayOfWeek })
  dayOfWeek: number;
  @Column()
  time: string;

  @ManyToOne(
    () => SchoolYearEntity,
    (schoolYear) => schoolYear.teacherLunchTimes
  )
  schoolYear: SchoolYearEntity;

  @Column({ type: "enum", enum: GradeLevel, default: "" })
  grade: GradeLevel;
}
