import React, { KeyboardEvent, useContext, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Link,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import SessionInfo from "../../models/SessionInfo";
import {
  forgotPassword,
  login,
  forgotUserName,
} from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";
import ConfirmDialog from "../ConfirmDialog";
import { NO_SCHOOL_YEAR } from "../../models/SchoolYear";

enum ForgottenCredential {
  USERNAME,
  PWD,
}
export const CredentialsPanel: React.FC = () => {
  const [userName, setUserName] = useState("");

  const {
    setPantryItems,
    setMenus,
    setUser,
    setUsers,
    setScheduledMenus,
    setOrders,
    setStudents,
    setNotifications,
    setSchool,
    setSchoolYears,
    setSnackbarMsg,
    setCurrentSchoolYear,
  } = useContext(AppContext);

  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>();
  const [forgottenCredential, setForgottenCredential] =
    useState<ForgottenCredential>();
  const [email, setEmail] = useState<string>("");

  const handleForgotCancelled = () => {
    setForgottenCredential(undefined);
    setEmail("");
  };

  const handleLogin = async () => {
    try {
      const loginResponse = await login(userName, password);
      setUser(loginResponse.user);
      setUsers(loginResponse.users);
      setStudents(loginResponse.students);
      setOrders(loginResponse.orders);
      setMenus(loginResponse.menus);
      setScheduledMenus(loginResponse.scheduledMenus);
      setNotifications(loginResponse.notifications);
      setPantryItems(loginResponse.pantryItems);
      setSchool(loginResponse.school);
      setSchoolYears(loginResponse.schoolYears);
      setCurrentSchoolYear(loginResponse.schoolYears.find((sy) => sy.isCurrent) ?? NO_SCHOOL_YEAR);


      localStorage.setItem("jwtToken", loginResponse.jwtToken);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.status === 401) {
        setErrorMsg("Invalid username or password");
      } else {
        setErrorMsg(
          "Unable to login: " +
            (axiosError.response?.data?.toString() ??
              axiosError.response?.statusText ??
              "Unknown server error")
        );
      }
    }
  };

  const handleCloseSnackbar = async () => {
    setErrorMsg(undefined);
  };

  const handleKeyPressed = async (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      await handleLogin();
    }
  };

  const handleSendForgotPwdEmail = async () => {
    try {
      await forgotPassword(userName);
      setSnackbarMsg("Email has been sent.")
      setForgottenCredential(undefined);
    } catch (error) {
      setForgottenCredential(undefined);
      const axiosError = error as AxiosError;
      setErrorMsg(
        "Unable to send email: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const handleSendForgotUsernameEmail = async () => {
    try {
      await forgotUserName(email);
      setSnackbarMsg("Email has been sent.")
      setForgottenCredential(undefined);
    } catch (error) {
      setForgottenCredential(undefined);
      const axiosError = error as AxiosError;
      setErrorMsg(
        "Unable to send email: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }

  };

  return (
    <>
      <img
        src="/logo.jpg"
        style={{ display: "block", width: "100%", height: "auto" }}
        alt="logo"
      />
      <Typography textAlign="center" variant="h6">
        Lunchtime Meal Ordering
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
        required
        type="Password"
        label="Password"
        variant="standard"
        value={password}
        onKeyUp={handleKeyPressed}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setPassword(event.target.value)
        }
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <Link
          component="button"
          disabled={!userName.length}
          variant="body2"
          onClick={() => setForgottenCredential(ForgottenCredential.PWD)}
        >
          Forgot Password
        </Link>
        <Link
          component="button"
          variant="body2"
          onClick={() => setForgottenCredential(ForgottenCredential.USERNAME)}
        >
          Forgot Username
        </Link>
      </Box>
      <Button
        variant="contained"
        color="primary"
        disabled={!userName.length || !password.length}
        onClick={handleLogin}
        sx={{
          marginTop: "50px",
        }}
      >
        Login
      </Button>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={errorMsg ? true : false}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert severity={"error"} onClose={handleCloseSnackbar}>
          {errorMsg}
        </Alert>
      </Snackbar>
      {forgottenCredential === ForgottenCredential.USERNAME ? (
        <ConfirmDialog
          open={true}
          onOk={() => {
            return;
          }}
          onCancel={handleForgotCancelled}
        >
          <TextField
            fullWidth
            required
            label="Email Associated With My Account"
            variant="standard"
            value={""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(event.target.value)
            }
          />
        </ConfirmDialog>
      ) : (
        <></>
      )}
      {forgottenCredential === ForgottenCredential.USERNAME ? (
        <ConfirmDialog
          open={true}
          title="Forgot Username"
          isOkDisabled={!email.length}
          onOk={handleSendForgotUsernameEmail}
          onCancel={handleForgotCancelled}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography>
              We&apos;ll look up your login information using your email address
              and send you your username.
            </Typography>

            <TextField
              fullWidth
              required
              label="Email"
              variant="standard"
              value={email}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(event.target.value)
              }
            />
          </Box>
        </ConfirmDialog>
      ) : (
        <></>
      )}
      {forgottenCredential === ForgottenCredential.PWD ? (
        <ConfirmDialog
          open={true}
          title="Forgot Password"
          onOk={handleSendForgotPwdEmail}
          onCancel={handleForgotCancelled}
        >
          <Typography>
            We&apos;ll lookup your email address and send instructions on how to
            reset your password.
          </Typography>
        </ConfirmDialog>
      ) : (
        <></>
      )}
    </>
  );
};

export interface LoginResponse extends SessionInfo {
  jwtToken: string;
}

const LoginPanel: React.FC = () => {
  return (
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
          <CredentialsPanel />
        </Box>
      </Box>
    </Box>
  );
};
export default LoginPanel;
