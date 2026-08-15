import React, { useContext, useEffect, useState } from "react";

import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import {
  completeParentRegistration,
  getInvitationDetails,
  InvitationDetails,
} from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { LOGIN_URL } from "../../MainAppPanel";
import {
  meetsPasswordRequirements,
  PASSWORD_HELPER_TEXT,
} from "../../utils/PasswordUtils";

/** Completes a pending registration at /register/:invitationId. */
const RegistrationPanel: React.FC = () => {
  const { setSnackbarErrorMsg, setSnackbarMsg } = useContext(AppContext);
  const { invitationId } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const loadInvitation = async () => {
      if (!invitationId) {
        setSnackbarErrorMsg("Invalid registration link.");
        setLoading(false);
        return;
      }
      try {
        const details = await getInvitationDetails(invitationId);
        setInvitation(details);
        setFirstName(details.firstName);
        setLastName(details.lastName);
        if (!details.needsUserName) {
          setUserName(details.userName);
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unable to load invitation"
        );
      } finally {
        setLoading(false);
      }
    };
    void loadInvitation();
  }, [invitationId, setSnackbarErrorMsg]);

  const passwordValid = meetsPasswordRequirements(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const userNameValid =
    !invitation?.needsUserName ||
    (userName.trim().length > 0 &&
      !userName.includes("@") &&
      !/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(
        userName.trim()
      ));
  const canSubmit =
    !!invitation &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    userNameValid &&
    passwordValid &&
    passwordsMatch;

  const handleCompleteRegistration = async () => {
    if (!invitationId || !invitation) {
      return;
    }
    try {
      await completeParentRegistration({
        invitationId,
        userName: invitation.needsUserName ? userName.trim() : undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        pwd: password,
      });
      setSnackbarMsg("Registration complete. You can now log in.");
      navigate(LOGIN_URL);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        axiosError.response?.data?.toString() ??
          axiosError.response?.statusText ??
          "Unable to complete registration"
      );
    }
  };

  if (loading) {
    return (
      <Stack
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ height: "100%" }}
      >
        <Typography>Loading invitation...</Typography>
      </Stack>
    );
  }

  if (!invitation) {
    return (
      <Stack
        direction="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        sx={{ height: "100%" }}
      >
        <Typography variant="h6">Invitation unavailable</Typography>
        <Button variant="contained" onClick={() => navigate(LOGIN_URL)}>
          Go to Login
        </Button>
      </Stack>
    );
  }

  return (
    <Stack
      className="registration-panel"
      direction="column"
      alignItems="center"
      gap={5}
      sx={{ height: "100%", overflow: "auto" }}
    >
      <Stack mt={5} direction="column" alignItems="center">
        <img
          src="/logo.jpg"
          style={{ display: "block", width: "300px", height: "auto" }}
          alt="logo"
        />
        <Typography textAlign="center" variant="h6">
          Complete Registration
        </Typography>
        <Typography
          textAlign="center"
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, width: "80%", maxWidth: "650px" }}
        >
          Finish setting up your account for {invitation.schoolName}.
        </Typography>
      </Stack>

      <Box
        sx={{
          width: "80%",
          maxWidth: "650px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
        }}
      >
        <TextField
          fullWidth
          required
          label="Email"
          variant="standard"
          value={userName}
          disabled={true}
        />
        <Box></Box>
        <TextField
          fullWidth
          required
          label="First Name"
          variant="standard"
          value={firstName}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setFirstName(event.target.value)
          }
        />
        <TextField
          fullWidth
          required
          label="Last Name"
          variant="standard"
          value={lastName}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setLastName(event.target.value)
          }
        />
        <TextField
          fullWidth
          required
          type="password"
          label="Password"
          variant="standard"
          value={password}
          error={password.length > 0 && !passwordValid}
          helperText={PASSWORD_HELPER_TEXT}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(event.target.value)
          }
        />
        <TextField
          fullWidth
          required
          type="password"
          label="Confirm Password"
          variant="standard"
          value={confirmPassword}
          error={confirmPassword.length > 0 && password !== confirmPassword}
          helperText={
            confirmPassword.length > 0 && password !== confirmPassword
              ? "Passwords do not match."
              : undefined
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setConfirmPassword(event.target.value)
          }
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        disabled={!canSubmit}
        onClick={handleCompleteRegistration}
        sx={{
          marginTop: "50px",
          marginBottom: "50px",
        }}
      >
        Complete Registration
      </Button>
    </Stack>
  );
};

export default RegistrationPanel;
