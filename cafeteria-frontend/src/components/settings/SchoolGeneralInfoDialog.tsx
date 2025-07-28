import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { updateSchoolGeneral } from "../../api/CafeteriaClient";
import School from "../../models/School";

interface SchoolGeneralDialogProps {
  open: boolean;
  onClose: () => void;
}

// Common timezone options
const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "UTC", label: "UTC" },
];

const SchoolGeneralInfoDialog: React.FC<SchoolGeneralDialogProps> = ({
  open,
  onClose,
}) => {
  const { school, setSchool } = useContext(AppContext);
  const [name, setName] = useState(school.name);
  const [timezone, setTimezone] = useState(school.timezone);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!school) return;

    setIsLoading(true);
    try {
      const updatedSchool: School = {
        ...school,
        name,
        timezone,
      };

      await updateSchoolGeneral(updatedSchool);
      setSchool(updatedSchool);
      onClose();
    } catch (error) {
      console.error("Error updating school general settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(school.name);
    setTimezone(school.timezone);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>School General Settings</DialogTitle>
      <DialogContent>
        <Stack direction="column" gap={3} sx={{ mt: 1 }}>
          <TextField
            label="School Name"
            value={name}
            variant="standard"
            onChange={(e) => setName(e.target.value)}
            fullWidth
            helperText="The name of your school"
          />
          
          <TextField
            select
            label="Timezone"
            value={timezone}
            variant="standard"
            onChange={(e) => setTimezone(e.target.value)}
            fullWidth
            helperText="The timezone for your school (used for scheduling and reports)"
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isLoading || !name.trim()}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchoolGeneralInfoDialog; 