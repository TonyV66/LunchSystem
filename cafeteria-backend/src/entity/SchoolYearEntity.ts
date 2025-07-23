import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import SchoolEntity from "./SchoolEntity";
import SchoolYearLunchTimeEntity from "./SchoolYearLunchTimeEntity";
import TeacherLunchTimeEntity from "./TeacherLunchTimeEntity";
import StudentLunchTimeEntity from "./StudentLunchTimeEntity";
import { OrderEntity } from "./OrderEntity";
import { DailyMenuEntity } from "./MenuEntity";
import StudentEntity from "./StudentEntity";
import UserEntity from "./UserEntity";
import GradeLunchTimeEntity from "./GradeLunchTimeEntity";

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
  @Column({default: ''})
  gradesAssignedByClass: string;
  @Column({default: true})
  oneTeacherPerStudent: boolean;

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

  @ManyToMany(() => UserEntity, (user) => user.schoolYears)
  @JoinTable({name: 'school_year_parents'})
  parents: UserEntity[];

  // Removing the students relationship as it's redundant
  // Students can be accessed through parents
}
