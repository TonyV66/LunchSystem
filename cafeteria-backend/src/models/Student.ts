import { Column, PrimaryGeneratedColumn } from "typeorm";

export default class Student {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  studentId: string;
  @Column()
  name: string;
}
