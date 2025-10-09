import React, { useState, useContext } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import SchoolYear from "../../models/SchoolYear";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";
import User, { Role } from "../../models/User";
import { replaceTeacher } from "../../api/CafeteriaClient";

interface DialogProps {
  schoolYear: SchoolYear;
  teacher: User;
  onClose: () => void;
}

const ReplaceTeacherDialog: React.FC<DialogProps> = ({
  schoolYear,
  teacher,
  onClose,
}) => {
  const {
    users,
    setSnackbarMsg,
    setSnackbarErrorMsg,
    schoolYears,
    setSchoolYears,
    currentSchoolYear,
    setCurrentSchoolYear,
  } = useContext(AppContext);

  // Add state for teacher name

  // Available grades - you can customize this based on your needs
  const [selectedTeacher, setSelectedTeacher] = useState<User>(teacher);

  const handleSave = async () => {
    if (selectedTeacher && teacher.id !== selectedTeacher.id) {
      try {
        // Update teacher name if it changed

        await replaceTeacher(schoolYear.id, teacher.id, selectedTeacher.id);

        const updatedSchoolYear = {
          ...schoolYear,
          teacherLunchTimes: schoolYear.teacherLunchTimes.map((tlt) =>
            tlt.teacherId !== teacher.id
              ? tlt
              : { ...tlt, teacherId: selectedTeacher.id }
          ),
          studentLunchTimes: schoolYear.studentLunchTimes.map((slt) =>
            slt.teacherId !== teacher.id
              ? slt
              : { ...slt, teacherId: selectedTeacher.id }
          ),
        };

        setSchoolYears(
          schoolYears.map((sy) =>
            sy.id !== schoolYear.id ? sy : updatedSchoolYear
          )
        );

        if (currentSchoolYear.id === updatedSchoolYear.id) {
          setCurrentSchoolYear(updatedSchoolYear);
        }

        setSnackbarMsg("Classroom teacher replaced successfully");
        onClose();
      } catch (error) {
        if (error instanceof AxiosError) {
          setSnackbarErrorMsg(
            error.response?.data ?? "Error replacing classroom teacher"
          );
        } else {
          setSnackbarErrorMsg("Error replacing classroom teacher");
        }
      }
    }
  };

  const availableTeachers = users
    .filter(
      (user) =>
        user.id === teacher.id ||
        (user.role === Role.TEACHER &&
          !schoolYear.teacherLunchTimes.some(
            (tlt) => tlt.teacherId === user.id
          ))
    )
    .sort((t1, t2) =>
      t1.name.toLowerCase().localeCompare(t2.name.toLowerCase())
    );
  return (
    <Dialog open={true} onClose={onClose} maxWidth="md">
      <DialogTitle>
        <Typography variant="h6">
          Replace Teacher{" "}
          {teacher.name || teacher.firstName + " " + teacher.lastName}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth variant="standard" sx={{ minWidth: "150px" }}>
          <InputLabel id="order-teacher-label">
            New Classroom Teacher
          </InputLabel>
          <Select
            labelId="order-teacher-label"
            id="order-teacher"
            variant="standard"
            value={selectedTeacher.id.toString() || "0"}
            label="New Classroom Teacher"
            onChange={(event: SelectChangeEvent) =>
              setSelectedTeacher(
                availableTeachers.find(
                  (t) => t.id === parseInt(event.target.value as string)
                )!
              )
            }
          >
            {availableTeachers.map((teacher) => (
              <MenuItem key={teacher.id} value={teacher.id.toString()}>
                {teacher.name.length > 0
                  ? teacher.name
                  : teacher.firstName + " " + teacher.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Cancel
        </Button>
        <Button
          disabled={selectedTeacher.id === teacher.id}
          onClick={handleSave}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReplaceTeacherDialog;
