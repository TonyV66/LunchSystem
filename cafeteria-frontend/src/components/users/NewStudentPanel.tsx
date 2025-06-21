import React, { useContext } from "react";
import {
  TextField,
  Stack,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { GradeLevel } from "../../models/GradeLevel";
import { DayOfWeek } from "../../models/DayOfWeek";
import { Role } from "../../models/User";
import StudentLunchtimeEditor from "./StudentLunchtimeEditor";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";

interface NewStudentPanelProps {
  studentFirstName: string;
  setStudentFirstName: (value: string) => void;
  studentLastName: string;
  setStudentLastName: (value: string) => void;
  studentBirthDate: Dayjs | null;
  setStudentBirthDate: (value: Dayjs | null) => void;
  selectedGrade: GradeLevel;
  setSelectedGrade: (grade: GradeLevel) => void;
  selectedTeachers: Record<DayOfWeek, number | null>;
  setSelectedTeachers: (teachers: Record<DayOfWeek, number | null>) => void;
}

const NewStudentPanel: React.FC<NewStudentPanelProps> = ({
  studentFirstName,
  setStudentFirstName,
  studentLastName,
  setStudentLastName,
  studentBirthDate,
  setStudentBirthDate,
  selectedGrade,
  setSelectedGrade,
  selectedTeachers,
  setSelectedTeachers,
}) => {
  const { currentSchoolYear, users } = useContext(AppContext);

  const teachers = users
    .filter((user) => user.role === Role.TEACHER)
    .sort((t1, t2) =>
      t1.name.toLowerCase().localeCompare(t2.name.toLowerCase())
    );

  const handleGradeSelected = (grade: GradeLevel) => {
    setSelectedGrade(grade);
  };

  const handleTeacherChange = (day: DayOfWeek, teacherId: number) => {
    const newTeachers = {
      ...selectedTeachers,
      [day]: teacherId,
    };
    setSelectedTeachers(newTeachers);
  };

  return (
    <Stack gap={2} direction="column">
      <TextField
        required
        label="First Name"
        variant="standard"
        value={studentFirstName}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setStudentFirstName(event.target.value)
        }
      />

      <TextField
        required
        label="Last Name"
        variant="standard"
        value={studentLastName}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setStudentLastName(event.target.value)
        }
      />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Birth Date"
          value={studentBirthDate}
          onChange={(newValue) => setStudentBirthDate(newValue)}
          slotProps={{
            textField: {
              variant: "standard",
              fullWidth: true,
            },
          }}
        />
      </LocalizationProvider>

      <StudentLunchtimeEditor
        schoolYear={currentSchoolYear}
        selectedGrade={selectedGrade}
        selectedTeachers={selectedTeachers}
        teachers={teachers}
        onGradeSelected={handleGradeSelected}
        onTeacherChange={handleTeacherChange}
      />
    </Stack>
  );
};

export default NewStudentPanel; 