import React, { useContext, useState } from "react";

import { Box, Button, TextField, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { changeForgottenPassword } from "../../api/CafeteriaClient";
import { LOGIN_URL } from "../../MainAppPanel";
import ConfirmDialog from "../ConfirmDialog";

const ChangeForgottenPwdPanel: React.FC = () => {
  const {
    setSnackbarErrorMsg,
  } = useContext(AppContext);

  const { forgottenLoginId } = useParams();
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmationPassword, setConfirmationPassword] = useState<string>("");
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleRegistration = async () => {
    try {
      await changeForgottenPassword(forgottenLoginId!, userName, password);
      setShowSuccessDialog(true);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Unable to reset password: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    navigate(LOGIN_URL);
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            flexBasis: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              padding: 2,
              display: "flex",
              gap: 2,
              flexDirection: "column",
              width: "80%",
              maxWidth: "400px",
            }}
          >
            <img
              src="/logo.jpg"
              style={{ display: "block", width: "100%", height: "auto" }}
              alt="logo"
            />
            <Typography textAlign="center" variant="h6">
              Password Reset
            </Typography>

            <TextField
              fullWidth
              required
              label="Username"
              variant="standard"
              value={userName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setUserName(event.target.value)
              }
            />

            <TextField
              fullWidth
              error={
                (password.length > 0 && password.length < 8) ||
                /\s/.test(password)
              }
              required
              helperText="Minimum of 8 characters. No spaces allowed."
              type="password"
              label="New Password"
              variant="standard"
              value={password}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(event.target.value)
              }
            />
            <TextField
              fullWidth
              required
              error={
                password.length &&
                confirmationPassword.length &&
                password !== confirmationPassword
                  ? true
                  : false
              }
              type="Password"
              label="Confirm New Password"
              variant="standard"
              value={confirmationPassword}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmationPassword(event.target.value)
              }
            />
            <Button
              variant="contained"
              color="primary"
              disabled={
                !userName.length ||
                /\s/.test(userName) ||
                password.length < 8 ||
                /\s/.test(password) ||
                password !== confirmationPassword
              }
              onClick={handleRegistration}
              sx={{
                marginTop: "50px",
              }}
            >
              Reset Password
            </Button>
          </Box>
        </Box>
      </Box>

      <ConfirmDialog
        open={showSuccessDialog}
        title="Password Reset Successful"
        hideCancelButton={true}
        onOk={handleSuccessDialogClose}
        onCancel={handleSuccessDialogClose}
      >
        <Typography>
          Your password has been successfully reset. You can now log in with your new password.
        </Typography>
      </ConfirmDialog>
    </>
  );
};

export default ChangeForgottenPwdPanel;
