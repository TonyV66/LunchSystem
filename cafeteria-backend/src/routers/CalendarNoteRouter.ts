import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import CalendarNoteEntity from "../entity/CalendarNoteEntity";
import CalendarNote from "../models/CalendarNote";

const CalendarNoteRouter: Router = express.Router();
interface Empty {}

CalendarNoteRouter.post<
  Empty,
  CalendarNote,
  { date: string; note: string },
  Empty
>("", async (req, res) => {
  const calendarNoteRepository =
    AppDataSource.getRepository(CalendarNoteEntity);
  const date = req.body.date?.trim();
  const note = req.body.note?.trim() ?? "";

  if (!date) {
    res.status(400).send();
    return;
  }

  if (note.length > 255) {
    res.status(400).send();
    return;
  }

  const existing = await calendarNoteRepository.findOne({
    where: {
      date,
      school: { id: req.school.id },
    },
  });

  if (existing) {
    existing.note = note;
    const saved = await calendarNoteRepository.save(existing);
    res.send(new CalendarNote(saved));
    return;
  }

  const saved = await calendarNoteRepository.save({
    date,
    note,
    school: req.school,
  } as CalendarNoteEntity);
  res.send(new CalendarNote(saved));
});

CalendarNoteRouter.delete<{ id: string }, Empty, Empty, Empty>(
  "/:id",
  async (req, res) => {
    const calendarNoteRepository =
      AppDataSource.getRepository(CalendarNoteEntity);
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).send();
      return;
    }

    const existing = await calendarNoteRepository.findOne({
      where: {
        id,
        school: { id: req.school.id },
      },
    });

    if (!existing) {
      res.status(404).send();
      return;
    }

    await calendarNoteRepository.delete(id);
    res.status(204).send();
  }
);

export default CalendarNoteRouter;
