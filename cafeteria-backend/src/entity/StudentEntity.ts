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
import SchoolEntity from "./SchoolEntity";
import UserEntity from "./UserEntity";

@Entity("student")
export default class StudentEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  studentId: string;
  @Column()
  name: string;
  @Column()
  firstName: string;
  @Column()
  lastName: string;
  @Column()
  birthDate: string;

  @OneToMany(() => MealEntity, (meal) => meal.student)
  meals: MealEntity[];

  @OneToMany(() => StudentLunchTimeEntity, (lunchTime) => lunchTime.student)
  lunchTimes: StudentLunchTimeEntity[];

  @ManyToMany(() => UserEntity, (user) => user.students)
  parents: UserEntity[];

  @ManyToOne(() => SchoolEntity, (school) => school.students)
  school: SchoolEntity;
}
