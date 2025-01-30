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
import SessionInfo from "../models/SessionInfo";
import {
  forgotPassword,
  login,
  register,
  resetPassword,
} from "../services/AdminClientServices";
import { AppContext } from "../AppContextProvider";

type Mode = "register" | "reset" | "forgot" | "login";

interface CredentialsPanelProps {
  isAdminLoginPanel?: boolean;
  userName: string;
  onUserNameChanged: (userName: string) => void;
  onModeChanged: (mode: Mode) => void;
}

const CredentialsPanel: React.FC<CredentialsPanelProps> = (props) => {
  const { setJwtToken, setPantryItems: setMenuItems, setMenus, setUser, setUsers, setScheduledMenus, setOrders, setStudents, setNotifications } =
  useContext(AppContext);

  const { userName, onUserNameChanged, onModeChanged } = props;

  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>();

  const handleLogin = async () => {
    const loginResponse = await login(userName, password) as LoginResponse;
    setUser(loginResponse.user);
    setUsers(loginResponse.users);
    setStudents(loginResponse.students);
    setOrders(loginResponse.orders);
    setMenus(loginResponse.menus);
    setScheduledMenus(loginResponse.scheduledMenus);
    setNotifications(loginResponse.notifications);
    setMenuItems(loginResponse.pantryItems);
    setJwtToken(loginResponse.jwtToken);
  };

  const handleCloseSnackbar = async () => {
    setErrorMsg(undefined);
  };

const handleKeyPressed = async (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'Enter') {
    await handleLogin();
  }
}

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
          onUserNameChanged(event.target.value)
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
        {props.isAdminLoginPanel ? (
          <Link
            component="button"
            variant="body2"
            onClick={() => onModeChanged("register")}
          >
            Register
          </Link>
        ) : (
          <></>
        )}
        <Link
          component="button"
          variant="body2"
          onClick={() => onModeChanged("forgot")}
        >
          Forgot Password
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
    </>
  );
};

interface RegistrationPanelProps {
  userName: string;
  onUserNameChanged: (userName: string) => void;
  onModeChanged: (mode: Mode) => void;
}

const RegisrationPanel: React.FC<RegistrationPanelProps> = (props) => {
  const { userName, onUserNameChanged, onModeChanged } = props;
  const [password, setPassword] = useState<string>("");
  const [confirmationPassword, setConfirmationPassword] = useState<string>("");
  const { setSnackbarMsg } = useContext(AppContext);

  const handleRegistration = async () => {
    const result = await register(userName, password);
    if (result) {
      onModeChanged("login");
      setSnackbarMsg("Registration complete.");
    }
  };

  return (
    <>
      <TextField
        fullWidth
        required
        error={
          (userName.length > 0 && userName.length < 5) || /\s/.test(userName)
        }
        helperText="Minimum of 5 characters. No spaces allowed."
        label="Username"
        variant="standard"
        value={userName}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onUserNameChanged(event.target.value)
        }
      />
      <TextField
        fullWidth
        error={
          (password.length > 0 && password.length < 8) || /\s/.test(password)
        }
        required
        helperText="Minimum of 8 characters. No spaces allowed."
        type="Password"
        label="Password"
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
        label="Confirm Password"
        variant="standard"
        value={confirmationPassword}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setConfirmationPassword(event.target.value)
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
          variant="body2"
          onClick={() => onModeChanged("login")}
        >
          Back To Login
        </Link>
      </Box>
      <Button
        variant="contained"
        color="primary"
        disabled={
          userName.length < 5 ||
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
        Register
      </Button>
    </>
  );
};

interface ForgotPasswordPanelProps {
  userName: string;
  onUserNameChanged: (userName: string) => void;
  onModeChanged: (mode: Mode) => void;
}

const ForgotPasswordPanel: React.FC<ForgotPasswordPanelProps> = (props) => {
  const { userName, onUserNameChanged, onModeChanged } = props;

  const handleForgotPassword = async () => {
    const result = await forgotPassword(userName);
    if (result) {
      onModeChanged("reset");
    }
  };

  return (
    <>
      <TextField
        fullWidth
        required
        label="Username"
        variant="standard"
        value={userName}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onUserNameChanged(event.target.value)
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
          variant="body2"
          onClick={() => onModeChanged("login")}
        >
          Back To Login
        </Link>
      </Box>
      <Button
        variant="contained"
        color="primary"
        disabled={!userName.length}
        onClick={handleForgotPassword}
        sx={{
          marginTop: "50px",
        }}
      >
        Send Verification Code
      </Button>
    </>
  );
};

interface ResetPasswordPanelProps {
  userName: string;
  onUserNameChanged: (userName: string) => void;
  onModeChanged: (mode: Mode) => void;
}

const ResetPasswordPanel: React.FC<ResetPasswordPanelProps> = (props) => {
  const { userName, onUserNameChanged, onModeChanged } = props;
  const [password, setPassword] = useState<string>("");
  const [confirmationPassword, setConfirmationPassword] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");

  const handleResetPassword = async () => {
    const result = await resetPassword(verificationCode, userName, password);
    if (result) {
      onModeChanged("login");
    }
  };

  return (
    <>
      <TextField
        fullWidth
        disabled={true}
        label="Username"
        variant="standard"
        value={userName}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onUserNameChanged(event.target.value)
        }
      />
      <TextField
        fullWidth
        required
        label="Verification Code"
        variant="standard"
        value={verificationCode}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setVerificationCode(event.target.value)
        }
      />
      <TextField
        fullWidth
        required
        error={
          (password.length > 0 && password.length < 8) || /\s/.test(password)
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
        fullWidth
        required
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
          variant="body2"
          onClick={() => onModeChanged("login")}
        >
          Back To Login
        </Link>
      </Box>
      <Button
        variant="contained"
        color="primary"
        disabled={
          !userName.length ||
          !verificationCode.length ||
          password.length < 8 ||
          /\s/.test(password) ||
          password !== confirmationPassword
        }
        onClick={handleResetPassword}
        sx={{
          marginTop: "50px",
        }}
      >
        Reset Password
      </Button>
    </>
  );
};

export interface LoginResponse extends SessionInfo {
  jwtToken: string;
}

interface LoginPanelProps {
  isAdmin?: boolean;
}

const LoginPanel: React.FC<LoginPanelProps> = (props) => {
  const [userName, setUserName] = useState<string>("");
  const [mode, setMode] = useState<Mode>("login");

  let body = <></>;
  switch (mode) {
    case "register":
      body = (
        <RegisrationPanel
          userName={userName}
          onModeChanged={setMode}
          onUserNameChanged={setUserName}
        />
      );
      break;
    case "reset":
      body = (
        <ResetPasswordPanel
          userName={userName}
          onModeChanged={setMode}
          onUserNameChanged={setUserName}
        />
      );
      break;
    case "forgot":
      body = (
        <ForgotPasswordPanel
          userName={userName}
          onModeChanged={setMode}
          onUserNameChanged={setUserName}
        />
      );
      break;
    default:
      body = (
        <CredentialsPanel
          isAdminLoginPanel={props.isAdmin}
          userName={userName}
          onModeChanged={setMode}
          onUserNameChanged={setUserName}
        />
      );
      break;
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "grey.500",
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
          {body}
        </Box>
      </Box>
    </Box>
  );
};
export default LoginPanel;
