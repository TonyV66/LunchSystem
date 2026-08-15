import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import UserEntity from "./UserEntity";
import StudentEntity from "./StudentEntity";
import SchoolYearEntity from "./SchoolYearEntity";

@Entity("enrollment")
@Unique(["userId", "studentId", "schoolYearId"])
export default class EnrollmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, default: true })
  active: boolean;

  @Column()
  userId: number;

  @Column()
  studentId: number;

  @Column()
  schoolYearId: number;

  @ManyToOne(() => UserEntity, (user) => user.enrollments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UserEntity;

  @ManyToOne(() => StudentEntity, (student) => student.enrollments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "studentId" })
  student: StudentEntity;

  @ManyToOne(() => SchoolYearEntity, (schoolYear) => schoolYear.enrollments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "schoolYearId" })
  schoolYear: SchoolYearEntity;
}
