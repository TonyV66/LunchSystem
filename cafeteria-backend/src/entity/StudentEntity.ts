import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import MealEntity from "./MealEntity";
import StudentLunchTimeEntity from "./StudentLunchTimeEntity";
import SchoolEntity from "./SchoolEntity";
import EnrollmentEntity from "./EnrollmentEntity";

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
  @Index()
  @Column({ type: "int", nullable: true, default: null })
  factsId: number | null;

  @OneToMany(() => MealEntity, (meal) => meal.student)
  meals: MealEntity[];

  @OneToMany(() => StudentLunchTimeEntity, (lunchTime) => lunchTime.student)
  lunchTimes: StudentLunchTimeEntity[];

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.student)
  enrollments: EnrollmentEntity[];

  @ManyToOne(() => SchoolEntity, (school) => school.students)
  school: SchoolEntity;
}
