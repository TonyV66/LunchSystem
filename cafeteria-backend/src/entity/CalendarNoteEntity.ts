import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import SchoolEntity from "./SchoolEntity";

@Entity("calendar_note")
export default class CalendarNoteEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Index()
  @Column()
  date: string;
  @Column({ length: 255 })
  note: string;
  @ManyToOne(() => SchoolEntity, (school) => school.calendarNotes, {
    onDelete: "CASCADE",
  })
  school: SchoolEntity;
}
