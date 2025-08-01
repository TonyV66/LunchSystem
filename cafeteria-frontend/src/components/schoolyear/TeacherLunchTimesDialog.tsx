import React, { useState, useContext } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  TextField,
} from "@mui/material";
import SchoolYear from "../../models/SchoolYear";
import { saveTeacherLunchTimes, updateUser } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";
import TimesList from "./TimesList";
import GradesList from "./GradesList";
import { DayOfWeek } from "../../models/DayOfWeek";
import { GradeLevel } from "../../models/GradeLevel";
import User from "../../models/User";

interface DialogProps {
  schoolYear: SchoolYear;
  teacher: User;
  onClose: () => void;
}

const TeacherLunchTimesDialog: React.FC<DialogProps> = ({
  schoolYear,
  teacher,
  onClose,
}) => {
  const {
    setSnackbarMsg,
    setSnackbarErrorMsg,
    schoolYears,
    setSchoolYears,
    currentSchoolYear,
    setCurrentSchoolYear,
    users,
    setUsers,
  } = useContext(AppContext);

  // Add state for teacher name
  const [teacherName, setTeacherName] = useState<string>(
    teacher.name || `${teacher.firstName} ${teacher.lastName}`
  );

  const mondayLunchTimes = Array.from(
    new Set(
      schoolYear.teacherLunchTimes
        .filter(
          (tlt) =>
            tlt.teacherId === teacher.id && tlt.dayOfWeek === DayOfWeek.MONDAY
        )
        .flatMap((tlt) => tlt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.MONDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const tuesdayLunchTimes = Array.from(
    new Set(
      schoolYear.teacherLunchTimes
        .filter(
          (tlt) =>
            tlt.teacherId === teacher.id && tlt.dayOfWeek === DayOfWeek.TUESDAY
        )
        .flatMap((tlt) => tlt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.TUESDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const wednesdayLunchTimes = Array.from(
    new Set(
      schoolYear.teacherLunchTimes
        .filter(
          (tlt) =>
            tlt.teacherId === teacher.id &&
            tlt.dayOfWeek === DayOfWeek.WEDNESDAY
        )
        .flatMap((tlt) => tlt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.WEDNESDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const thursdayLunchTimes = Array.from(
    new Set(
      schoolYear.teacherLunchTimes
        .filter(
          (tlt) =>
            tlt.teacherId === teacher.id && tlt.dayOfWeek === DayOfWeek.THURSDAY
        )
        .flatMap((tlt) => tlt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.THURSDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const fridayLunchTimes = Array.from(
    new Set(
      schoolYear.teacherLunchTimes
        .filter(
          (tlt) =>
            tlt.teacherId === teacher.id && tlt.dayOfWeek === DayOfWeek.FRIDAY
        )
        .flatMap((tlt) => tlt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.FRIDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const [selectedMondayTimes, setSelectedMondayTimes] = useState<string[]>(
    schoolYear.teacherLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.MONDAY && lt.teacherId === teacher.id
    )?.times ?? []
  );
  const [selectedTuesdayTimes, setSelectedTuesdayTimes] = useState<string[]>(
    schoolYear.teacherLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.TUESDAY && lt.teacherId === teacher.id
    )?.times ?? []
  );
  const [selectedWednesdayTimes, setSelectedWednesdayTimes] = useState<
    string[]
  >(
    schoolYear.teacherLunchTimes.find(
      (lt) =>
        lt.dayOfWeek === DayOfWeek.WEDNESDAY && lt.teacherId === teacher.id
    )?.times ?? []
  );
  const [selectedThursdayTimes, setSelectedThursdayTimes] = useState<string[]>(
    schoolYear.teacherLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.THURSDAY && lt.teacherId === teacher.id
    )?.times ?? []
  );
  const [selectedFridayTimes, setSelectedFridayTimes] = useState<string[]>(
    schoolYear.teacherLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.FRIDAY && lt.teacherId === teacher.id
    )?.times ?? []
  );

  // Add state for selected grades for each day
  const [selectedMondayGrades, setSelectedMondayGrades] = useState<GradeLevel[]>(
    schoolYear.teacherLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.MONDAY && lt.teacherId === teacher.id
    )?.grades ?? []
  );
  const [selectedTuesdayGrades, setSelectedTuesdayGrades] = useState<GradeLevel[]>(
    schoolYear.teacherLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.TUESDAY && lt.teacherId === teacher.id
    )?.grades ?? []
  );
  const [selectedWednesdayGrades, setSelectedWednesdayGrades] = useState<GradeLevel[]>(
    schoolYear.teacherLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.WEDNESDAY && lt.teacherId === teacher.id
    )?.grades ?? []
  );
  const [selectedThursdayGrades, setSelectedThursdayGrades] = useState<GradeLevel[]>(
    schoolYear.teacherLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.THURSDAY && lt.teacherId === teacher.id
    )?.grades ?? []
  );
  const [selectedFridayGrades, setSelectedFridayGrades] = useState<GradeLevel[]>(
    schoolYear.teacherLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.FRIDAY && lt.teacherId === teacher.id
    )?.grades ?? []
  );

  // Available grades - you can customize this based on your needs

  const handleSave = async () => {
    try {
      // Update teacher name if it changed
      if (teacherName !== teacher.name) {
        const updatedTeacher = { ...teacher, name: teacherName };
        await updateUser(updatedTeacher);
        
        // Update users in context
        setUsers(
          users.map((u) => (u.id === teacher.id ? updatedTeacher : u))
        );
      }

      const teacherLunchTimes = [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          times: selectedMondayTimes,
          teacherId: teacher.id,
          grades: selectedMondayGrades,
        },
        {
          dayOfWeek: DayOfWeek.TUESDAY,
          times: selectedTuesdayTimes,
          teacherId: teacher.id,
          grades: selectedTuesdayGrades,
        },
        {
          dayOfWeek: DayOfWeek.WEDNESDAY,
          times: selectedWednesdayTimes,
          teacherId: teacher.id,
          grades: selectedWednesdayGrades,
        },
        {
          dayOfWeek: DayOfWeek.THURSDAY,
          times: selectedThursdayTimes,
          teacherId: teacher.id,
          grades: selectedThursdayGrades,
        },
        {
          dayOfWeek: DayOfWeek.FRIDAY,
          times: selectedFridayTimes,
          teacherId: teacher.id,
          grades: selectedFridayGrades,
        },
      ];

      await saveTeacherLunchTimes(
        schoolYear.id.toString(),
        teacher.id,
        teacherLunchTimes
      );

      const updatedSchoolYear = {
        ...schoolYear,
        teacherLunchTimes: schoolYear.teacherLunchTimes
          .filter((glt) => glt.teacherId !== teacher.id)
          .concat(teacherLunchTimes),
      };

      setSchoolYears(
        schoolYears.map((sy) =>
          sy.id !== schoolYear.id ? sy : updatedSchoolYear
        )
      );

      if (currentSchoolYear.id === updatedSchoolYear.id) {
        setCurrentSchoolYear(updatedSchoolYear);
      }

      setSnackbarMsg("Teacher lunch times saved successfully");
      onClose();
    } catch (error) {
      if (error instanceof AxiosError) {
        setSnackbarErrorMsg(
          error.response?.data ?? "Error saving teacher lunch times"
        );
      } else {
        setSnackbarErrorMsg("Error saving teacher lunch times");
      }
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md">
      <DialogTitle>
        <Typography variant="h6">
          Edit Teacher {teacher.name || teacher.firstName + " " + teacher.lastName}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack pt={1}spacing={2}>
          <TextField
            label="Reffered To As"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            fullWidth
            variant="standard"
            size="small"
          />
          <Stack
            direction="row"
            justifyContent="stretch"
            alignItems="stretch"
            spacing={2}
          >
            <Stack direction="column">
              <Typography fontWeight="bold" variant="body2">
                Monday
              </Typography>
              <Box
                p={1}
                sx={{
                  display: "grid",
                  height: "350px",
                  gridTemplateColumns: "1fr",
                  gridTemplateRows: "auto 1fr auto 1fr",
                  backgroundColor: "#f7f7f7",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption">
                  Lunchtime
                </Typography>
                <TimesList
                  availTimes={mondayLunchTimes}
                  selectedTimes={selectedMondayTimes}
                  onSelectedTimesChanged={setSelectedMondayTimes}
                  isSingleSelect={true}
                />
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  Grades
                </Typography>
                <GradesList
                  availGrades={schoolYear.gradesAssignedByClass}
                  selectedGrades={selectedMondayGrades}
                  onSelectedGradesChanged={setSelectedMondayGrades}
                  isSingleSelect={false}
                />
              </Box>
            </Stack>
            <Stack direction="column" >
              <Typography fontWeight="bold" variant="body2">
                Tuesday
              </Typography>
              <Box
                p={1}
                sx={{
                  display: "grid",
                  height: "350px",
                  gridTemplateColumns: "1fr",
                  gridTemplateRows: "auto 1fr auto 1fr",
                  backgroundColor: "#f7f7f7",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption">
                  Lunchtime
                </Typography>
                <TimesList
                  availTimes={tuesdayLunchTimes}
                  selectedTimes={selectedTuesdayTimes}
                  onSelectedTimesChanged={setSelectedTuesdayTimes}
                  isSingleSelect={true}
                />
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  Grades
                </Typography>
                <GradesList
                  availGrades={schoolYear.gradesAssignedByClass}
                  selectedGrades={selectedTuesdayGrades}
                  onSelectedGradesChanged={setSelectedTuesdayGrades}
                  isSingleSelect={false}
                />
              </Box>
            </Stack>
            <Stack direction="column">
              <Typography fontWeight="bold" variant="body2">
                Wednesday
              </Typography>
              <Box
                p={1}
                sx={{
                  display: "grid",
                  height: "350px",
                  gridTemplateColumns: "1fr",
                  gridTemplateRows: "auto 1fr auto 1fr",
                  backgroundColor: "#f7f7f7",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption">
                  Lunchtime
                </Typography>
                <TimesList
                  availTimes={wednesdayLunchTimes}
                  selectedTimes={selectedWednesdayTimes}
                  onSelectedTimesChanged={setSelectedWednesdayTimes}
                  isSingleSelect={true}
                />
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  Grades
                </Typography>
                <GradesList
                  availGrades={schoolYear.gradesAssignedByClass}
                  selectedGrades={selectedWednesdayGrades}
                  onSelectedGradesChanged={setSelectedWednesdayGrades}
                  isSingleSelect={false}
                />
              </Box>
            </Stack>
            <Stack direction="column">
              <Typography fontWeight="bold" variant="body2">
                Thursday
              </Typography>
              <Box
                p={1}
                sx={{
                  display: "grid",
                  height: "350px",
                  gridTemplateColumns: "1fr",
                  gridTemplateRows: "auto 1fr auto 1fr",
                  backgroundColor: "#f7f7f7",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption">
                  Lunchtime
                </Typography>
                <TimesList
                  availTimes={thursdayLunchTimes}
                  selectedTimes={selectedThursdayTimes}
                  onSelectedTimesChanged={setSelectedThursdayTimes}
                  isSingleSelect={true}
                />
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  Grades
                </Typography>
                <GradesList
                  availGrades={schoolYear.gradesAssignedByClass}
                  selectedGrades={selectedThursdayGrades}
                  onSelectedGradesChanged={setSelectedThursdayGrades}
                  isSingleSelect={false}
                />
              </Box>
            </Stack>
            <Stack direction="column">
              <Typography fontWeight="bold" variant="body2">
                Friday
              </Typography>
              <Box
                p={1}
                sx={{
                  display: "grid",
                  height: "350px",
                  gridTemplateColumns: "1fr",
                  gridTemplateRows: "auto 1fr auto 1fr",
                  backgroundColor: "#f7f7f7",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption">
                  Lunchtime
                </Typography>
                <TimesList
                  availTimes={fridayLunchTimes}
                  isSingleSelect={true}
                  selectedTimes={selectedFridayTimes}
                  onSelectedTimesChanged={setSelectedFridayTimes}
                />
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  Grades
                </Typography>
                <GradesList
                  availGrades={schoolYear.gradesAssignedByClass}
                  selectedGrades={selectedFridayGrades}
                  onSelectedGradesChanged={setSelectedFridayGrades}
                  isSingleSelect={false}
                />
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeacherLunchTimesDialog;
