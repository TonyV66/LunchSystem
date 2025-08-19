import React from "react";
import { Tab, Tabs, Stack, Typography, Box } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  CLASSROOM_URL,
  FAMILY_URL,
  STUDENTS_URL,
  USERS_URL,
} from "../../MainAppPanel";
import StudentsTable from "./StudentsTable";
import { Role } from "../../models/User";

const FamilyPage: React.FC = () => {
  const { currentSchoolYear, user } = useContext(AppContext);

  const navigate = useNavigate();

  const handleTabSelected = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

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
      {user.role !== Role.PARENT && user.role !== Role.STAFF ? (
        <Stack direction="row" justifyContent="space-between">
          <Tabs
            value={FAMILY_URL}
            onChange={handleTabSelected}
            aria-label="secondary tabs example"
          >
            {user.role === Role.ADMIN && (
              <Tab value={USERS_URL} label="Users" />
            )}
            {user.role === Role.TEACHER && (
              <Tab value={STUDENTS_URL} label="Students" />
            )}
            {user.role === Role.TEACHER && (
              <Tab value={CLASSROOM_URL} label="Classroom" />
            )}
            <Tab value={FAMILY_URL} label="Family" />
          </Tabs>
          {user.role === Role.ADMIN && (
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
      ) : (
        <Box mt={2}></Box>
      )}

      <StudentsTable user={user} family={true} />
    </Stack>
  );
};

export default FamilyPage;
