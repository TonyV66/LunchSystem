import React, { useContext, useEffect, useState } from "react";

import { Box, Button, TextField, Typography } from "@mui/material";
import { getInvitation, register } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { NO_SCHOOL_YEAR } from "../../models/SchoolYear";

const RegisrationPanel: React.FC = () => {
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
    setSnackbarErrorMsg,
    setSchoolYears,
    setCurrentSchoolYear
  } = useContext(AppContext);

  const { inviteId } = useParams();
  const [userName, setUserName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmationPassword, setConfirmationPassword] = useState<string>("");

  useEffect(() => {
    const fetchInvitation = async () => {
      const invitation = await getInvitation(inviteId!);
      if (invitation.user) {
        setEmail(invitation.user.email);
        setFirstName(invitation.user.firstName);
        setLastName(invitation.user.firstName);
      }
    };
    fetchInvitation();
  }, []);

  const handleRegistration = async () => {
    try {
      const loginResponse = await register(
        inviteId!,
        userName,
        firstName,
        lastName,
        password,
        email
      );
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
        setSnackbarErrorMsg("Invalid username or password");
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
            Lunch System Registration
          </Typography>

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
          <TextField
            fullWidth
            label="Email"
            variant="standard"
            required
            value={email}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(event.target.value)
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
          <Button
            variant="contained"
            color="primary"
            disabled={
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
            }}
          >
            Create Account
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisrationPanel;
