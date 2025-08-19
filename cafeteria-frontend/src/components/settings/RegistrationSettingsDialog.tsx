import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Box,
  FormHelperText,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { updateSchoolRegistration } from "../../api/CafeteriaClient";
import School from "../../models/School";

interface RegistrationSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const RegistrationSettingsDialog: React.FC<RegistrationSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const { school, setSchool } = useContext(AppContext);
  const [registrationCode, setRegistrationCode] = useState(
    school.registrationCode
  );
  const [openRegistration, setOpenRegistration] = useState(
    school.openRegistration
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!school) return;

    setIsLoading(true);
    try {
      const updatedSchool: School = {
        ...school,
        registrationCode,
        openRegistration,
      };

      await updateSchoolRegistration(updatedSchool);
      setSchool(updatedSchool);
      onClose();
    } catch (error) {
      console.error("Error updating registration settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setRegistrationCode(school.registrationCode);
    setOpenRegistration(school.openRegistration);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Registration Settings</DialogTitle>
      <DialogContent>
        <Stack direction="column" gap={3} sx={{ mt: 1 }}>
          <TextField
            label="Registration Code"
            value={registrationCode}
            variant="standard"
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
              setRegistrationCode(value);
            }}
            fullWidth
            helperText="6 - 8 uppercase letters"
            error={registrationCode.length > 0 && (registrationCode.length < 6 || registrationCode.length > 8)}
            slotProps={{
              input: {
                style: { textTransform: 'uppercase' }
              }
            }}
          />

          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={openRegistration}
                  onChange={(e) => setOpenRegistration(e.target.checked)}
                />
              }
              label="Open Registration"
            />
            <FormHelperText>If not open, invitation is required.</FormHelperText>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={
            isLoading || 
            !registrationCode.trim() || 
            registrationCode.length < 6 || 
            registrationCode.length > 8
          }
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrationSettingsDialog;
