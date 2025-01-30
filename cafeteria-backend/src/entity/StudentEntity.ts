import { Entity, ManyToOne, OneToMany } from "typeorm";
import MealEntity from "./MealEntity";
import UserEntity from "./UserEntity";
import Student from "../models/Student";

@Entity('student')
export default class StudentEntity extends Student {
  @OneToMany(() => MealEntity, (meal) => meal.student)
  meals: MealEntity[];
  @ManyToOne(() => UserEntity, (teacher) => teacher.students)
  teacher: UserEntity;
  @ManyToOne(() => UserEntity, (parent) => parent.children)
  parent: UserEntity;
}
