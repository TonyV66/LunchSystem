import React from "react";
import { Stack, Typography, FormControlLabel, Checkbox } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext, useState } from "react";

import StudentsTable from "./StudentsTable";
import PeopleTabs from "./PeopleTabs";
import { Role } from "../../models/User";
import { STUDENTS_URL } from "../../MainAppPanel";

const StudentsPage: React.FC = () => {
  const { currentSchoolYear, user } = useContext(AppContext);
  const [includeRegisteredStudents, setIncludeRegisteredStudents] =
    useState(true);
  const [includePendingStudents, setIncludePendingStudents] = useState(false);

  return (
    <Stack
      pl={2}
      pr={2}
      direction="column"
      gap={1}
      sx={{
        height: "100%",
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <PeopleTabs value={STUDENTS_URL} />
        <Stack direction="row" alignItems="center" gap={1}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={includeRegisteredStudents}
                onChange={(e) => setIncludeRegisteredStudents(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Registered Students</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={includePendingStudents}
                onChange={(e) => setIncludePendingStudents(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Pending Students</Typography>}
          />
        </Stack>
        {(user.role === Role.ADMIN || user.role === Role.PRINCIPAL) && (
          <Stack direction="column">
            <Typography variant="body2" fontWeight="bold">
              School Year:
            </Typography>
            <Typography
              variant="body2"
              color={!currentSchoolYear.id ? "error" : "text.primary"}
            >
              {currentSchoolYear.name || "No School Year Selected"}
            </Typography>
          </Stack>
        )}
      </Stack>

      <StudentsTable
        includeRegisteredStudents={includeRegisteredStudents}
        includePendingStudents={includePendingStudents}
      />
    </Stack>
  );
};

export default StudentsPage;
