import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import SchoolEntity from "./SchoolEntity";
import SchoolLunchTimeEntity from "./SchoolLunchTimeEntity";
import TeacherLunchTimeEntity from "./TeacherLunchTimeEntity";
import StudentLunchTimeEntity from "./StudentLunchTimeEntity";
import { OrderEntity } from "./OrderEntity";
import { DailyMenuEntity } from "./MenuEntity";

@Entity("school_year")
export default class SchoolYearEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  startDate: string;
  @Column()
  endDate: string;
  @OneToMany(() => SchoolLunchTimeEntity, (lunchTime) => lunchTime.schoolYear, {cascade: true})
  lunchTimes: SchoolLunchTimeEntity[];
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
}
