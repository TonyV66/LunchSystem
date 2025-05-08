import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import MealEntity from "./MealEntity";
import StudentLunchTimeEntity from "./StudentLunchTimeEntity";
import { GradeLevel } from "../models/GradeLevel";
import SchoolEntity from "./SchoolEntity";
import SchoolYearEntity from "./SchoolYearEntity";

@Entity("student")
export default class StudentEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  studentId: string;
  @Column()
  name: string;
  @Column({ type: "enum", enum: GradeLevel, default: "" })
  grade: GradeLevel | null;
  @OneToMany(() => MealEntity, (meal) => meal.student)
  meals: MealEntity[];

  @OneToMany(() => StudentLunchTimeEntity, (lunchTime) => lunchTime.student)
  lunchTimes: StudentLunchTimeEntity[];

  @ManyToMany(() => SchoolYearEntity, (schoolYear) => schoolYear.students)
  schoolYears: SchoolYearEntity[];

  @ManyToOne(() => SchoolEntity, (school) => school.students)
  school: SchoolEntity;
}
