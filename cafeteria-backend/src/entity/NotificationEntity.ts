import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Notification } from "../models/Notification";
import SchoolEntity from "./SchoolEntity";

@Entity("notification")
export default class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  startDate: string;
  @Column()
  endDate: string;
  @Column()
  msg: string;
  @Column({ default: () => "CURRENT_TIMESTAMP" })
  creationDate: Date;
  @ManyToOne(() => SchoolEntity, (school) => school.notifications)
  school: SchoolEntity;
}
