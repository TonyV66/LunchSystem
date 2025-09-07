import React from "react";
import { Stack, Typography, Box } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext } from "react";
import {
  FAMILY_URL,
} from "../../MainAppPanel";
import StudentsTable from "./StudentsTable";
import { Role } from "../../models/User";
import PeopleTabs from "./PeopleTabs";

const FamilyPage: React.FC = () => {
  const { currentSchoolYear, user } = useContext(AppContext);

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
          <PeopleTabs value={FAMILY_URL} />
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
