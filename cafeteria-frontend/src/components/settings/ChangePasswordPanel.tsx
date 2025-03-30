import React, { useContext, useState } from "react";
import { Button, Paper, TextField } from "@mui/material";
import { changePassword } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";
import { AppContext } from "../../AppContextProvider";

const ChangePasswordPanel: React.FC = () => {
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
    } catch (error) {
      const axiosError = error as AxiosError
      setSnackbarErrorMsg(axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error");
    }
  };

  return (
    <Paper sx={{p:2, marginLeft: 'auto', marginRight: 'auto', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center'}}>
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
      />
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
        sx={{
          marginTop: "50px",
        }}
      >
        Change Password
      </Button>
    </Paper>
  );
};

export default ChangePasswordPanel;
