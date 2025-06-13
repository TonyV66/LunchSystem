import React, { useState, useContext } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import SchoolYear from "../../models/SchoolYear";
import { saveTeacherLunchTimes } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";
import TimesList from "./TimesList";
import { DayOfWeek } from "../../models/DayOfWeek";
import DailyLunchTimes from "../../models/DailyLunchTimes";
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
  const { setSnackbarMsg, setSnackbarErrorMsg, schoolYears, setSchoolYears } =
    useContext(AppContext);

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

  const handleSave = async () => {
    try {
      const dailyLunchTimes: DailyLunchTimes[] = [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          times: selectedMondayTimes,
        },
        {
          dayOfWeek: DayOfWeek.TUESDAY,
          times: selectedTuesdayTimes,
        },
        {
          dayOfWeek: DayOfWeek.WEDNESDAY,
          times: selectedWednesdayTimes,
        },
        {
          dayOfWeek: DayOfWeek.THURSDAY,
          times: selectedThursdayTimes,
        },
        {
          dayOfWeek: DayOfWeek.FRIDAY,
          times: selectedFridayTimes,
        },
      ];

      await saveTeacherLunchTimes(
        schoolYear.id.toString(),
        teacher.id,
        dailyLunchTimes
      );

      const updatedTimes = [...schoolYear.teacherLunchTimes];
      dailyLunchTimes.forEach((newTime) => {
        const index = updatedTimes.findIndex(
          (lt) =>
            lt.teacherId === teacher.id && lt.dayOfWeek === newTime.dayOfWeek
        );
        if (index >= 0) {
          updatedTimes[index] = {
            ...updatedTimes[index],
            times: newTime.times,
          };
        } else {
          updatedTimes.push({
            ...newTime,
            teacherId: teacher.id,
          });
        }
      });

      setSchoolYears(
        schoolYears.map((sy) =>
          sy.id !== schoolYear.id
            ? schoolYear
            : { ...sy, teacherLunchTimes: updatedTimes }
        )
      );
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
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Edit Lunch Times for {teacher.name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "grid",
            height: "200px",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
            gridTemplateRows: "auto 1fr",
            gap: 2,
          }}
        >
          <Typography mt={2} fontWeight="bold" variant="body2">
            Monday
          </Typography>
          <Typography mt={2} fontWeight="bold" variant="body2">
            Tuesday
          </Typography>
          <Typography mt={2} fontWeight="bold" variant="body2">
            Wednesday
          </Typography>
          <Typography mt={2} fontWeight="bold" variant="body2">
            Thursday
          </Typography>
          <Typography mt={2} fontWeight="bold" variant="body2">
            Friday
          </Typography>
          <TimesList
            availTimes={mondayLunchTimes}
            selectedTimes={selectedMondayTimes}
            onSelectedTimesChanged={setSelectedMondayTimes}
            isSingleSelect={true}
          />
          <TimesList
            availTimes={tuesdayLunchTimes}
            selectedTimes={selectedTuesdayTimes}
            onSelectedTimesChanged={setSelectedTuesdayTimes}
            isSingleSelect={true}
          />
          <TimesList
            availTimes={wednesdayLunchTimes}
            selectedTimes={selectedWednesdayTimes}
            onSelectedTimesChanged={setSelectedWednesdayTimes}
            isSingleSelect={true}
          />
          <TimesList
            availTimes={thursdayLunchTimes}
            selectedTimes={selectedThursdayTimes}
            onSelectedTimesChanged={setSelectedThursdayTimes}
            isSingleSelect={true}
          />
          <TimesList
            availTimes={fridayLunchTimes}
            isSingleSelect={true}
            selectedTimes={selectedFridayTimes}
            onSelectedTimesChanged={setSelectedFridayTimes}
          />
        </Box>
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
