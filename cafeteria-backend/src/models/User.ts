import { Column, Index, PrimaryGeneratedColumn } from "typeorm";

export enum Role {
  ADMIN,
  TEACHER,
  PARENT,
  CAFETERIA,
}

export default class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Index()
  @Column()
  userName: string;
  @Column()
  pwd: string;
  @Column()
  name: string;
  @Column()
  description: string;
  @Column({type: 'enum', enum: Role})
  role: Role;
  @Column()
  mondayLunchTime: string;
  @Column()
  tuesdayLunchTime: string;
  @Column()
  wednesdayLunchTime: string;
  @Column()
  thursdayLunchTime: string;
  @Column()
  fridayLunchTime: string;
  @Column({default: '2024-01-01 00:00:00'})
  notificationReviewDate: Date;
}
