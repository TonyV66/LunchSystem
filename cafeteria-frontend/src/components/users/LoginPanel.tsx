import React, { KeyboardEvent, useContext, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import SessionInfo from "../../models/SessionInfo";
import {
  forgotPassword,
  login,
  verifyAccountForPasswordReset,
} from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";
import ConfirmDialog from "../ConfirmDialog";
import { NO_SCHOOL_YEAR } from "../../models/SchoolYear";
import RegistrationDialog from "./RegistrationDialog";

const REMEMBERED_USERNAME_KEY = "rememberedUserName";

const isValidEmailAddress = (value: string): boolean => {
  const email = value.trim();
  return (
    email.includes("@") && email.includes(".") && !email.includes(" ")
  );
};

export const CredentialsPanel: React.FC = () => {
  const [userName, setUserName] = useState(
    () => localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? ""
  );
  const [rememberMe, setRememberMe] = useState(
    () => !!localStorage.getItem(REMEMBERED_USERNAME_KEY)
  );

  const {
    setPantryItems,
    setIngredients,
    setUnitsOfMeasure,
    setMenus,
    setUser,
    setUsers,
    setScheduledMenus,
    setOrders,
    setStudents,
    setNotifications,
    setCalendarNotes,
    setSchool,
    setSchoolYears,
    setSnackbarMsg,
    setCurrentSchoolYear,
    setSurvey,
  } = useContext(AppContext);

  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>();
  const [forgottenCredential, setForgottenCredential] =
    useState(false);
  const [incompleteRegistration, setIncompleteRegistration] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationAccount, setRegistrationAccount] = useState<{
    exists: boolean;
    isFactsRegistrationPending: boolean;
  }>();
  const [registrationNotice, setRegistrationNotice] = useState<{
    title: string;
    message: string;
  }>();

  const handleForgotCancelled = () => {
    setForgottenCredential(false);
  };

  const openRegistrationDialog = (account: {
    exists: boolean;
    isFactsRegistrationPending: boolean;
  }) => {
    setRegistrationAccount({
      exists: account.exists,
      isFactsRegistrationPending: account.isFactsRegistrationPending,
    });
    setShowRegistration(true);
  };

  const handleRegisterClicked = async () => {
    if (!isValidEmailAddress(userName)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    try {
      const account = await verifyAccountForPasswordReset(userName);
      if (!account.exists) {
        openRegistrationDialog(account);
        return;
      }
      if (account.allInactive) {
        setRegistrationNotice({
          title: "Account Inactive",
          message: "Your account is currently inactive.",
        });
        return;
      }
      if (account.allActive) {
        setRegistrationNotice({
          title: "Already Registered",
          message:
            "You are already registered. Please log in with your username and password.",
        });
        return;
      }
      if (!account.hasPassword) {
        openRegistrationDialog(account);
        return;
      }
      setRegistrationNotice({
        title: "Already Registered",
        message:
          "You are already registered. Please log in with your username and password.",
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      setErrorMsg(
        "Unable to verify account: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const handleForgotPasswordClicked = async () => {
    if (!isValidEmailAddress(userName)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    try {
      const account = await verifyAccountForPasswordReset(userName);
      if (!account.exists) {
        setErrorMsg("No account exists with that username.");
        return;
      }
      if (!account.hasPassword) {
        setIncompleteRegistration(true);
        return;
      }
      setForgottenCredential(true);
    } catch (error) {
      const axiosError = error as AxiosError;
      setErrorMsg(
        "Unable to verify account: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
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
      setCalendarNotes(loginResponse.calendarNotes ?? []);
      setPantryItems(loginResponse.pantryItems);
      setIngredients(loginResponse.ingredients);
      setUnitsOfMeasure(loginResponse.unitsOfMeasure);
      setSchool(loginResponse.school);
      setSchoolYears(loginResponse.schoolYears);
      setSurvey(loginResponse.survey);
      setCurrentSchoolYear(loginResponse.schoolYears.find((sy) => sy.isCurrent) ?? NO_SCHOOL_YEAR);

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_USERNAME_KEY, userName);
      } else {
        localStorage.removeItem(REMEMBERED_USERNAME_KEY);
      }
      localStorage.setItem("jwtToken", loginResponse.jwtToken);
    } catch (error) {
      const axiosError = error as AxiosError;
      const serverMsg =
        typeof axiosError.response?.data === "string"
          ? axiosError.response.data
          : axiosError.response?.data?.toString();
      if (serverMsg === "Registration has not been completed.") {
        setIncompleteRegistration(true);
      } else if (
        serverMsg === "Your account is currently inactive." ||
        serverMsg === "No student enrollments found for the active school year." ||
        serverMsg === "No active school year found."
      ) {
        setErrorMsg(serverMsg);
      } else if (axiosError.status === 401) {
        setErrorMsg("Invalid username or password");
      } else {
        setErrorMsg(
          "Unable to login: " +
            (serverMsg ??
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
      setForgottenCredential(false);
    } catch (error) {
      setForgottenCredential(false);
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
        label="Email"
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
      <FormControlLabel
        control={
          <Checkbox
            checked={rememberMe}
            size="small"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const checked = event.target.checked;
              setRememberMe(checked);
              if (!checked) {
                localStorage.removeItem(REMEMBERED_USERNAME_KEY);
              }
            }}
          />
        }
        label="Remember Me"
        sx={{ color: "text.secondary" }}
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
          onClick={handleForgotPasswordClicked}
          sx={{
            opacity: !userName.length ? 0.5 : 1,
            cursor: !userName.length ? 'not-allowed' : 'pointer',
            color: !userName.length ? 'text.disabled' : 'primary.main',
            '&:hover': {
              textDecoration: !userName.length ? 'none' : 'underline'
            }
          }}
        >
          Forgot Password
        </Link>
        <Link
          component="button"
          disabled={!userName.length}
          variant="body2"
          onClick={handleRegisterClicked}
          sx={{
            opacity: !userName.length ? 0.5 : 1,
            cursor: !userName.length ? 'not-allowed' : 'pointer',
            color: !userName.length ? 'text.disabled' : 'primary.main',
            '&:hover': {
              textDecoration: !userName.length ? 'none' : 'underline'
            }
          }}
        >
          Register
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
      {forgottenCredential ? (
        <ConfirmDialog
          open={true}
          title="Forgot Password"
          onOk={handleSendForgotPwdEmail}
          onCancel={handleForgotCancelled}
        >
          <Typography>
            We&apos;ll email instructions on how to
            reset your password.
          </Typography>
        </ConfirmDialog>
      ) : (
        <></>
      )}
      {incompleteRegistration ? (
        <ConfirmDialog
          open={true}
          title="Email Verification Required"
          hideCancelButton
          onOk={() => setIncompleteRegistration(false)}
          onCancel={() => setIncompleteRegistration(false)}
        >
          <Typography>
            The account exists, but email verification has not been completed. Please use the Register link to complete email verification & registration.
          </Typography>
        </ConfirmDialog>
      ) : (
        <></>
      )}
      {registrationNotice ? (
        <ConfirmDialog
          open={true}
          title={registrationNotice.title}
          hideCancelButton
          onOk={() => setRegistrationNotice(undefined)}
          onCancel={() => setRegistrationNotice(undefined)}
        >
          <Typography>{registrationNotice.message}</Typography>
        </ConfirmDialog>
      ) : (
        <></>
      )}
      {showRegistration && registrationAccount ? (
        <RegistrationDialog
          open={true}
          userName={userName}
          exists={registrationAccount.exists}
          isFactsRegistrationPending={
            registrationAccount.isFactsRegistrationPending
          }
          onCancel={() => {
            setShowRegistration(false);
            setRegistrationAccount(undefined);
          }}
        />
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
