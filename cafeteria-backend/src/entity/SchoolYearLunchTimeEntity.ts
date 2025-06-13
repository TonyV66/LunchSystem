import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DayOfWeek } from "../models/DayOfWeek";
import SchoolYearEntity from "./SchoolYearEntity";


@Entity("school_lunch_time")
export default class SchoolYearLunchTimeEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({type: 'enum', enum: DayOfWeek})
  dayOfWeek: number;
  @Column({nullable: false, default: ''})
  time: string;
  @ManyToOne(() => SchoolYearEntity, (schoolYear) => schoolYear.lunchTimes, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  schoolYear: SchoolYearEntity;
}
