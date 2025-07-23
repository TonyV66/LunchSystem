import React, { useState } from "react";
import {
  TextField,
  Stack,
} from "@mui/material";
import StudentLunchtimeEditor from "./StudentLunchtimeEditor";
import { StudentLunchTime } from "../../models/StudentLunchTime";

interface NewStudentPanelProps {
  onFirstNameChanged: (value: string) => void;
  onLastNameChanged: (value: string) => void;
  onLunchtimesChanged: (lunchTimes: StudentLunchTime[]) => void;
}

const NewStudentPanel: React.FC<NewStudentPanelProps> = ({
  onFirstNameChanged,
  onLastNameChanged,
  onLunchtimesChanged,
}) => {

  const [studentFirstName, setStudentFirstName] = useState<string>("");
  const [studentLastName, setStudentLastName] = useState<string>("");

  const handleFirstNameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStudentFirstName(event.target.value);
    onFirstNameChanged(event.target.value);
  };

  const handleLastNameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStudentLastName(event.target.value);
    onLastNameChanged(event.target.value);
  };

  const handleLunchtimesChanged = (lunchTimes: StudentLunchTime[]) => {
    onLunchtimesChanged(lunchTimes);
  };
  return (
    <Stack gap={2} direction="column">
      <TextField
        required
        label="First Name"
        variant="standard"
        value={studentFirstName}
        onChange={handleFirstNameChanged}
      />

      <TextField
        required
        label="Last Name"
        variant="standard"
        value={studentLastName}
        onChange={handleLastNameChanged}
      />

      <StudentLunchtimeEditor
        onLunchtimesChanged={handleLunchtimesChanged}
      />
    </Stack>
  );
};

export default NewStudentPanel; 