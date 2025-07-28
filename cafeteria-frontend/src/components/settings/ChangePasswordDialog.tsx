import React, { useContext, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { changePassword } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";
import { AppContext } from "../../AppContextProvider";

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onClose,
}) => {
  const {setSnackbarErrorMsg, setSnackbarMsg} = useContext(AppContext);
  const [password, setPassword] = useState<string>("");
  const [confirmationPassword, setConfirmationPassword] = useState<string>("");
  const [oldPassword, setOldPassword] = useState<string>("");

  const handleChangePassword = async () => {
    try {
      await changePassword(oldPassword, password);
      setOldPassword('');
      setPassword('');
      setConfirmationPassword('');
      setSnackbarMsg("Password changed");
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError
      setSnackbarErrorMsg(axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error");
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setPassword('');
    setConfirmationPassword('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <TextField
          required
          fullWidth
          label="Old Password"
          type="Password"
          variant="standard"
          value={oldPassword}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setOldPassword(event.target.value)
          }
          sx={{ mb: 2, mt: 1 }}
        />
        <TextField
          required
          fullWidth
          error={
            (password.length > 0 && password.length < 6) || /\s/.test(password)
          }
          helperText="Minimum of 8 characters. No spaces allowed."
          type="Password"
          label="New Password"
          variant="standard"
          value={password}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(event.target.value)
          }
          sx={{ mb: 2 }}
        />
        <TextField
          required
          fullWidth
          type="Password"
          label="Confirm New Password"
          variant="standard"
          value={confirmationPassword}
          error={
            password.length &&
            confirmationPassword.length &&
            password !== confirmationPassword
              ? true
              : false
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setConfirmationPassword(event.target.value)
          }
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          disabled={
            !oldPassword.length ||
            password.length < 6 ||
            /\s/.test(password) ||
            password !== confirmationPassword
          }
          onClick={handleChangePassword}
        >
          Change Password
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog; 