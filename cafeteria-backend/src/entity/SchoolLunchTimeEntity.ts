import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DayOfWeek } from "../models/DailyLunchTime";
import SchoolYearEntity from "./SchoolYearEntity";


@Entity("school_lunch_time")
export default class SchoolLunchTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({type: 'enum', enum: DayOfWeek})
  dayOfWeek: number;
  @Column()
  time: string;
  @ManyToOne(() => SchoolYearEntity, (schoolYear) => schoolYear.lunchTimes, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  schoolYear: SchoolYearEntity;
}
