import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import MealEntity from "./MealEntity";
import UserEntity from "./UserEntity";
import Student from "../models/Student";
import StudentLunchTimeEntity from "./StudentLunchTimeEntity";

@Entity("student")
export default class StudentEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  studentId: string;
  @Column()
  name: string;
  @OneToMany(() => MealEntity, (meal) => meal.student)
  meals: MealEntity[];
  @OneToMany(() => StudentLunchTimeEntity, (lunchTime) => lunchTime.student)
  lunchTimes: StudentLunchTimeEntity[];
  @ManyToOne(() => UserEntity, (parent) => parent.children)
  parent: UserEntity;
}
