import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { createStudent } from "../../api/CafeteriaClient";
import Student from "../../models/Student";
import { AxiosError } from "axios";

interface DialogProps {
  onNewStudent: (student: Student) => void;
  onClose: () => void;
}

const NewStudentDialog: React.FC<DialogProps> = ({ onClose, onNewStudent }) => {
  const { students, setStudents, setSnackbarErrorMsg } = useContext(AppContext);

  const [userName, setUserName] = useState("");

  const isSaveDisabled = !userName.length;

  const handleSaveStudent = async () => {
    try {
      const newStudent = await createStudent({
        id: 0,
        name: userName,
        studentId: "",
        lunchTimes: [],
      });
      setStudents(students.concat(newStudent));
      onNewStudent(newStudent);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error creating student: " +
        (axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error")
      );
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullWidth={true}
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>{"Add Student"}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            pt: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            required
            label="First & Last Name"
            variant="standard"
            value={userName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setUserName(event.target.value)
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => handleSaveStudent()}
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewStudentDialog;
