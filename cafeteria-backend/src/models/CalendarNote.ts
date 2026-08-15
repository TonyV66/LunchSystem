import CalendarNoteEntity from "../entity/CalendarNoteEntity";

export default class CalendarNote {
  id: number;
  date: string;
  note: string;

  constructor(entity: CalendarNoteEntity) {
    this.id = entity.id;
    this.date = entity.date;
    this.note = entity.note;
  }
}
