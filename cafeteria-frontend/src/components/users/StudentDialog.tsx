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
import { createStudent, updateStudent } from "../../api/CafeteriaClient";
import Student from "../../models/Student";
import { AxiosError } from "axios";
import { GradeLevel } from "../../models/GradeLevel";

interface DialogProps {
  student?: Student;
  onClose: (student?: Student) => void;
}

const StudentDialog: React.FC<DialogProps> = ({ onClose, student }) => {
  const { students, setStudents, setSnackbarErrorMsg } = useContext(AppContext);

  const [updatedStudent, setUpdatedStudent] = useState<Student>(student || {
    id: 0,
    grade: GradeLevel.PRE_K,
    name: "",
    studentId: "",
  });

  const isSaveDisabled = !updatedStudent.name.length;

  const handleSaveStudent = async () => {
    try {
      if (!updatedStudent.id) {
        const newStudent = await createStudent(updatedStudent);
        setStudents(students.concat(newStudent));
        onClose(newStudent);
      } else {
        const savedStudent = await updateStudent(updatedStudent);
        setStudents(students.map(student => student.id === savedStudent.id ? savedStudent : student))
        onClose(savedStudent);
      }
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
      onClose={() => onClose()}
      fullWidth={true}
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>{!student ? "Add Student" : "Edit Student"}</DialogTitle>
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
            value={updatedStudent.name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setUpdatedStudent({...updatedStudent, name: event.target.value})
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose()}>
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

export default StudentDialog;
