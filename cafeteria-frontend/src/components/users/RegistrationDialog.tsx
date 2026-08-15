import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Box,
} from "@mui/material";
import { registerParent } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";

interface RegistrationDialogProps {
  open: boolean;
  userName: string;
  exists: boolean;
  isFactsRegistrationPending: boolean;
  onCancel: () => void;
}

/**
 * Completes the start-registration step after LoginPanel has verified the
 * username is eligible (does not exist, or exists without a password).
 */
const RegistrationDialog: React.FC<RegistrationDialogProps> = ({
  open,
  userName,
  exists,
  isFactsRegistrationPending,
  onCancel,
}) => {
  const { setSnackbarErrorMsg, setSnackbarMsg } = useContext(AppContext);
  const [schoolCode, setSchoolCode] = useState("");

  const needsSchoolCode = !exists || !isFactsRegistrationPending;
  const canSubmit = !needsSchoolCode || schoolCode.trim().length > 0;

  const handleRegister = async () => {
    try {
      await registerParent({
        username: userName.trim(),
        ...(needsSchoolCode
          ? { schoolRegistrationCode: schoolCode.trim() }
          : {}),
      });
      setSnackbarMsg(
        "Please check your email to complete the verification & registration process."
      );
      onCancel();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        axiosError.response?.data?.toString() ??
          axiosError.response?.statusText ??
          "Unable to complete registration"
      );
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      onClose={onCancel}
      aria-labelledby="registration-dialog"
    >
      <DialogTitle id="registration-dialog">Email Verification & Registration</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            pt: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            label="Email"
            variant="standard"
            value={userName}
            disabled
          />
          {needsSchoolCode ? (
            <TextField
              fullWidth
              required
              label="School Registration Code"
              helperText="Provided by your school."
              variant="standard"
              value={schoolCode}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setSchoolCode(event.target.value)
              }
            />
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!canSubmit}
          onClick={handleRegister}
        >
          Verify Email & Register
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrationDialog;
