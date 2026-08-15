import React, { ChangeEvent, useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { AxiosError } from "axios";
import { deleteCalendarNote, saveCalendarNote } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";

interface CalendarNoteDialogProps {
  date: string;
  onClose: () => void;
}

const CalendarNoteDialog: React.FC<CalendarNoteDialogProps> = ({
  date,
  onClose,
}) => {
  const {
    calendarNotes,
    setCalendarNotes,
    setSnackbarErrorMsg,
  } = useContext(AppContext);

  const existingNote = calendarNotes.find((note) => note.date === date);
  const [noteText, setNoteText] = useState(existingNote?.note ?? "");

  useEffect(() => {
    setNoteText(existingNote?.note ?? "");
  }, [existingNote]);

  const canSave = noteText.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    try {
      const saved = await saveCalendarNote({
        id: existingNote?.id ?? 0,
        date,
        note: noteText.trim(),
      });

      if (existingNote) {
        setCalendarNotes(
          calendarNotes.map((note) =>
            note.id === saved.id ? saved : note,
          ),
        );
      } else {
        setCalendarNotes(calendarNotes.concat(saved));
      }
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error saving calendar note: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error"),
      );
    }
  };

  const handleDelete = async () => {
    if (!existingNote) {
      return;
    }

    try {
      await deleteCalendarNote(existingNote.id);
      setCalendarNotes(
        calendarNotes.filter((note) => note.id !== existingNote.id),
      );
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error deleting calendar note: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error"),
      );
    }
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Note For{" "}
        {DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Note"
          fullWidth
          variant="standard"
          value={noteText}
          inputProps={{ maxLength: 255 }}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setNoteText(event.target.value)
          }
          helperText={`${noteText.length}/255`}
        />
      </DialogContent>
      <DialogActions>
        {existingNote ? (
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete Note
          </Button>
        ) : null}
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained"onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!canSave} onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalendarNoteDialog;
