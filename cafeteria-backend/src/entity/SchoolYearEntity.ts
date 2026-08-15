import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import SchoolEntity from "./SchoolEntity";
import SchoolYearLunchTimeEntity from "./SchoolYearLunchTimeEntity";
import TeacherLunchTimeEntity from "./TeacherLunchTimeEntity";
import StudentLunchTimeEntity from "./StudentLunchTimeEntity";
import { OrderEntity } from "./OrderEntity";
import DailyMenuEntity from "./DailyMenuEntity";
import GradeLunchTimeEntity from "./GradeLunchTimeEntity";
import EnrollmentEntity from "./EnrollmentEntity";

@Entity("school_year")
export default class SchoolYearEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({nullable: false})
  name: string;
  @Column({nullable: false, default: false})
  isCurrent: boolean;
  @Column()
  startDate: string;
  @Column()
  endDate: string;
  @Index()
  @Column({ type: "int", nullable: true, default: null })
  factsId: number | null;
  @Column({default: ''})
  gradesAssignedByClass: string;
  @Column({default: true})
  oneTeacherPerStudent: boolean;
  @Column({default: true})
  hideSchedule: boolean;

  @OneToMany(() => SchoolYearLunchTimeEntity, (lunchTime) => lunchTime.schoolYear, {cascade: true})
  lunchTimes: SchoolYearLunchTimeEntity[];
  @OneToMany(() => GradeLunchTimeEntity, (lunchTime) => lunchTime.schoolYear)
  gradeLunchTimes: GradeLunchTimeEntity[];
  @OneToMany(() => TeacherLunchTimeEntity, (lunchTime) => lunchTime.schoolYear)
  teacherLunchTimes: TeacherLunchTimeEntity[];
  @OneToMany(() => StudentLunchTimeEntity, (lunchTime) => lunchTime.schoolYear)
  studentLunchTimes: StudentLunchTimeEntity[];
  @OneToMany(() => OrderEntity, (order) => order.schoolYear)
  orders: OrderEntity[];
  @OneToMany(() => DailyMenuEntity, (menu) => menu.schoolYear)
  dailyMenus: DailyMenuEntity[];
  @ManyToOne(() => SchoolEntity, (school) => school.schoolYears)
  school: SchoolEntity;

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.schoolYear)
  enrollments: EnrollmentEntity[];
}
