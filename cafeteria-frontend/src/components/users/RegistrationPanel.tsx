import React, { useContext, useState } from "react";

import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { register } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

const RegisrationPanel: React.FC = () => {
  const {
    setSnackbarErrorMsg,
    setSnackbarMsg,
  } = useContext(AppContext);

  const [userName, setUserName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmationPassword, setConfirmationPassword] = useState<string>("");
  const [schoolCode, setSchoolCode] = useState<string>("");

  const navigate = useNavigate();

  const handleRegistration = async () => {
    try {
      await register(
        schoolCode,
        userName,
        firstName,
        lastName,
        password,
        email
      );
      setSnackbarMsg("Registration successful. Please login.");
      navigate("/");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.status === 401) {
        setSnackbarErrorMsg(
          axiosError.response?.data?.toString() ??
            "Unable to complete registration"
        );
      } else {
        setSnackbarErrorMsg(
          "Unable to login: " +
            (axiosError.response?.data?.toString() ??
              axiosError.response?.statusText ??
              "Unknown server error")
        );
      }
    }
  };

  return (
        <Stack className="registration-panel" direction="column" alignItems="center" gap={5} sx={{ height: "100%", overflow: "auto" }}>
          <Stack mt={5} direction="column" alignItems="center">
            <img
              src="/logo.jpg"
              style={{ display: "block", width: "300px", height: "auto" }}
              alt="logo"
            />
            <Typography textAlign="center" variant="h6">
              Lunch System Registration
            </Typography>
          </Stack>

          <Stack
            sx={{ width: "80%", maxWidth: "650px" }}
            direction="row"
            flexWrap="wrap"
            gap={2}
          >
            <TextField
              sx={{ flex: 1, minWidth: "300px" }}
              required
              label="School Registration Code"
              helperText="Provided by your school. Uppercase letters only."
              variant="standard"
              value={schoolCode}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const value = event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                setSchoolCode(value);
              }}
              slotProps={{
                input: {
                  style: { textTransform: 'uppercase' }
                }
              }}
            />

            <TextField
              sx={{ flex: 1, minWidth: "300px" }}
              label="Email On File With School"
              variant="standard"
              helperText="Email used by school to contact you."
              required
              value={email}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(event.target.value)
              }
            />

            <TextField
              sx={{ flex: 1, minWidth: "300px" }}
              required
              label="First Name"
              variant="standard"
              value={firstName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setFirstName(event.target.value)
              }
            />
            <TextField
              sx={{ flex: 1, minWidth: "300px" }}
              required
              label="Last Name"
              variant="standard"
              value={lastName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setLastName(event.target.value)
              }
            />

            <TextField
              sx={{ flex: 1, minWidth: "300px" }}
              required
              error={
                (userName.length > 0 && userName.length < 5) ||
                /\s/.test(userName)
              }
              helperText="Minimum of 5 characters. No spaces allowed."
              label="Username"
              variant="standard"
              value={userName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setUserName(event.target.value)
              }
            />

            <Box sx={{ flex: 1, minWidth: "300px" }}></Box>

            <TextField
              sx={{ flex: 1, minWidth: "300px" }}
              error={
                (password.length > 0 && password.length < 8) ||
                /\s/.test(password)
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
              sx={{ flex: 1, minWidth: "300px" }}
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
          </Stack>
          <Button
            variant="contained"
            color="primary"
            disabled={
              !schoolCode.length ||
              !firstName.length ||
              !lastName.length ||
              !email.length ||
              userName.length < 5 ||
              /\s/.test(userName) ||
              password.length < 8 ||
              /\s/.test(password) ||
              password !== confirmationPassword
            }
            onClick={handleRegistration}
            sx={{
              marginTop: "50px",
              marginBottom: "50px",
            }}
          >
            Create Account
          </Button>
        </Stack>
  );
};

export default RegisrationPanel;
