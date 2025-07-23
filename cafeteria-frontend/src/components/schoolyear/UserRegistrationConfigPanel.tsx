import React, { useContext, useState } from "react";
import { Typography, Stack, Switch } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { updateSchoolRegistration } from "../../api/CafeteriaClient";

const UserRegistrationConfigPanel: React.FC = () => {
  const { school, setSchool } = useContext(AppContext);
  const [openRegistration, setOpenRegistration] = useState(
    school.openRegistration
  );

  const handleOpenRegistrationChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOpenRegistration(!event.target.checked);
    
    try {
      await updateSchoolRegistration({
        ...school,
        openRegistration: !event.target.checked,
      });
      setSchool({...school, openRegistration: !event.target.checked});
    } catch (error) {
      // Revert the local state if the API call fails
      setOpenRegistration(event.target.checked);
      console.error("Failed to update registration setting:", error);
    }
  };

  return (
    <Stack
      className="user-registration-container"
      direction="column"
      minWidth={"200px"}
    >
      <Stack
        sx={{ height: "45px" }}
        direction="row"
        justifyContent={"space-between"}
        alignItems={"flex-end"}
      >
        <Typography fontWeight="bold" variant="body1">
          User Registration
        </Typography>
      </Stack>
      <Stack
        gap={2}
        flexGrow={1}
        sx={{
          border: "1px solid #e0e0e0",
          p: 2,
          borderRadius: 2,
        }}
      >
        <Stack>
          <Typography fontWeight="bold">Code</Typography>
          <Typography>{school.registrationCode}</Typography>
        </Stack>
        <Stack>
          <Typography fontWeight="bold">By Invitation Only</Typography>
          <Stack direction="row" alignItems="center" gap={1}>          
            <Typography variant="body2" fontWeight={openRegistration ? "bold" : "normal"}>No</Typography>
            <Switch
              checked={!openRegistration}
              onChange={handleOpenRegistrationChange}
              color="primary"
            />
            <Typography variant="body2" fontWeight={!openRegistration ? "bold" : "normal"}>Yes</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default UserRegistrationConfigPanel;
