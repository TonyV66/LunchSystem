import { Column, PrimaryGeneratedColumn } from "typeorm";

export class Notification {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  startDate: string;
  @Column()
  endDate: string;
  @Column()
  msg: string;
  @Column({default: () => "CURRENT_TIMESTAMP"})
  creationDate: Date;
}