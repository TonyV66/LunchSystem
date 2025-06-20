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
import { saveGradeLunchTimes } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";
import TimesList from "./TimesList";
import { DayOfWeek } from "../../models/DayOfWeek";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import DailyLunchTimes from "../../models/DailyLunchTimes";

interface DialogProps {
  schoolYear: SchoolYear;
  grade: GradeLevel;
  onClose: () => void;
}

const GradeLevelLunchTimesDialog: React.FC<DialogProps> = ({
  schoolYear,
  grade,
  onClose,
}) => {
  const { setSnackbarMsg, setSnackbarErrorMsg, schoolYears, setSchoolYears, currentSchoolYear, setCurrentSchoolYear } =
    useContext(AppContext);

  const mondayLunchTimes = Array.from(
    new Set(
      schoolYear.gradeLunchTimes
        .filter(
          (slt) => slt.grade === grade && slt.dayOfWeek === DayOfWeek.MONDAY
        )
        .flatMap((slt) => slt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.MONDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const tuesdayLunchTimes = Array.from(
    new Set(
      schoolYear.gradeLunchTimes
        .filter(
          (slt) => slt.grade === grade && slt.dayOfWeek === DayOfWeek.TUESDAY
        )
        .flatMap((slt) => slt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.TUESDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const wednesdayLunchTimes = Array.from(
    new Set(
      schoolYear.gradeLunchTimes
        .filter(
          (slt) => slt.grade === grade && slt.dayOfWeek === DayOfWeek.WEDNESDAY
        )
        .flatMap((slt) => slt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.WEDNESDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const thursdayLunchTimes = Array.from(
    new Set(
      schoolYear.gradeLunchTimes
        .filter(
          (slt) => slt.grade === grade && slt.dayOfWeek === DayOfWeek.THURSDAY
        )
        .flatMap((slt) => slt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.THURSDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const fridayLunchTimes = Array.from(
    new Set(
      schoolYear.gradeLunchTimes
        .filter(
          (slt) => slt.grade === grade && slt.dayOfWeek === DayOfWeek.FRIDAY
        )
        .flatMap((slt) => slt.times)
        .concat(
          schoolYear.lunchTimes
            .filter((slt) => slt.dayOfWeek === DayOfWeek.FRIDAY)
            .flatMap((slt) => slt.times)
        )
    )
  ).sort();

  const [selectedMondayTimes, setSelectedMondayTimes] = useState<string[]>(
    schoolYear.gradeLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.MONDAY && lt.grade === grade
    )?.times ?? []
  );
  const [selectedTuesdayTimes, setSelectedTuesdayTimes] = useState<string[]>(
    schoolYear.gradeLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.TUESDAY && lt.grade === grade
    )?.times ?? []
  );
  const [selectedWednesdayTimes, setSelectedWednesdayTimes] = useState<
    string[]
  >(
    schoolYear.gradeLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.WEDNESDAY && lt.grade === grade
    )?.times ?? []
  );
  const [selectedThursdayTimes, setSelectedThursdayTimes] = useState<string[]>(
    schoolYear.gradeLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.THURSDAY && lt.grade === grade
    )?.times ?? []
  );
  const [selectedFridayTimes, setSelectedFridayTimes] = useState<string[]>(
    schoolYear.gradeLunchTimes.find(
      (lt) => lt.dayOfWeek === DayOfWeek.FRIDAY && lt.grade === grade
    )?.times ?? []
  );

  const handleSave = async () => {
    try {
      const dailyLunchTimes: DailyLunchTimes[] = [];
      dailyLunchTimes.push({
        dayOfWeek: DayOfWeek.MONDAY,
        times: selectedMondayTimes.sort(),
      });
      dailyLunchTimes.push({
        dayOfWeek: DayOfWeek.TUESDAY,
        times: selectedTuesdayTimes.sort(),
      });
      dailyLunchTimes.push({
        dayOfWeek: DayOfWeek.WEDNESDAY,
        times: selectedWednesdayTimes.sort(),
      });
      dailyLunchTimes.push({
        dayOfWeek: DayOfWeek.THURSDAY,
        times: selectedThursdayTimes.sort(),
      });
      dailyLunchTimes.push({
        dayOfWeek: DayOfWeek.FRIDAY,
        times: selectedFridayTimes.sort(),
      });

      await saveGradeLunchTimes(schoolYear.id, grade, dailyLunchTimes);

      const gradeLunchTimes = dailyLunchTimes.map((dlt) => ({
        dayOfWeek: dlt.dayOfWeek,
        times: dlt.times,
        grade: grade,
      }));

      const updatedSchoolYear = {
        ...schoolYear,
        gradeLunchTimes: schoolYear.gradeLunchTimes
        .filter((glt) => glt.grade !== grade)
        .concat(gradeLunchTimes),
      };

      setSchoolYears(
        schoolYears.map((sy) =>
          sy.id !== schoolYear.id
            ? sy
            : updatedSchoolYear
        )
      );

      if (currentSchoolYear.id === updatedSchoolYear.id) {
        setCurrentSchoolYear(updatedSchoolYear);
      }

      setSnackbarMsg("Lunch times saved");

      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error saving lunch times: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  return (
    <Dialog
      open={true}
      onClose={() => {}}
      maxWidth="md"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>
        {getGradeName(grade) + " Lunch Times " + schoolYear.name}
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
          />
          <TimesList
            availTimes={tuesdayLunchTimes}
            selectedTimes={selectedTuesdayTimes}
            onSelectedTimesChanged={setSelectedTuesdayTimes}
          />
          <TimesList
            availTimes={wednesdayLunchTimes}
            selectedTimes={selectedWednesdayTimes}
            onSelectedTimesChanged={setSelectedWednesdayTimes}
          />
          <TimesList
            availTimes={thursdayLunchTimes}
            selectedTimes={selectedThursdayTimes}
            onSelectedTimesChanged={setSelectedThursdayTimes}
          />
          <TimesList
            availTimes={fridayLunchTimes}
            selectedTimes={selectedFridayTimes}
            onSelectedTimesChanged={setSelectedFridayTimes}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => handleSave()}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeLevelLunchTimesDialog;
