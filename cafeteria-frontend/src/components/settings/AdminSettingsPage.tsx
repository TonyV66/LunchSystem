import React, { useState } from "react";
import {
  Box,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import SchoolSettingsPanel from "./SchoolSettingsPanel";
import ChangePasswordPanel from "./ChangePasswordPanel";

export enum RelativeDateCountType {
  DAYS,
  WEEKS,
}

export enum RelativeDateTarget {
  DAY_MEAL_IS_SERVED,
  WEEK_MEAL_IS_SERVED,
}

enum SelectedTab {
  PWD_TAB,
  SYSTEM_SETTINGS_TAB
};

const AdminSettingsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<SelectedTab>(SelectedTab.PWD_TAB);

  const handleTabChanged = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <Box p={1} >
      <Tabs
        sx={{mb: 2}}
        value={selectedTab}
        onChange={handleTabChanged}
        aria-label="basic tabs example"
      >
        <Tab label={<Typography variant="caption">Change Password</Typography>} />
        <Tab label={<Typography variant="caption">System Defaults</Typography>} />
      </Tabs>
      {selectedTab === SelectedTab.PWD_TAB ? <ChangePasswordPanel/> : <SchoolSettingsPanel/>}
    </Box>
  );
};

export default AdminSettingsPage;
