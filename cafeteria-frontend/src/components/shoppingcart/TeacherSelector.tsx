import React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import User from "../../models/User";
import { DAY_NAMES } from "../../DateTimeUtils";

interface TeacherSelectorProps {
  selectedTeacher: User | undefined;
  teachers: User[];
  dayOfWeek: number;
  onTeacherSelected: (teacherId: number) => void;
}

const TeacherSelector: React.FC<TeacherSelectorProps> = ({
  selectedTeacher,
  teachers,
  dayOfWeek,
  onTeacherSelected,
}) => {
  return (
    <FormControl variant="standard" sx={{ minWidth: "150px" }}>
      <InputLabel id="order-teacher-label">
        {DAY_NAMES[dayOfWeek]}
      </InputLabel>
      <Select
        labelId="order-teacher-label"
        id="order-teacher"
        variant="standard"
        value={selectedTeacher?.id.toString() || "0"}
        label="Teacher Name"
        onChange={(event: SelectChangeEvent) =>
          onTeacherSelected(parseInt(event.target.value as string))
        }
      >
        {!selectedTeacher?.id ? (
          <MuiMenuItem disabled={true} key={0} value={"0"}>
            <Typography color="textDisabled">Select a teacher</Typography>
          </MuiMenuItem>
        ) : (
          <></>
        )}

        {teachers.map((teacher) => (
          <MuiMenuItem key={teacher.id} value={teacher.id.toString()}>
            {teacher.name}
          </MuiMenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TeacherSelector; 