import React, { useContext, useEffect, useState } from "react";

import { Box, Button, Typography } from "@mui/material";
import SessionInfo from "../../models/SessionInfo";
import { AppContext } from "../../AppContextProvider";
import { useNavigate, useParams } from "react-router-dom";
import { LOGIN_URL, REGISTRATION_URL } from "../../MainAppPanel";
import User from "../../models/User";
import Student from "../../models/Student";
import { acceptInvitation, getInvitation } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

export interface LoginResponse extends SessionInfo {
  jwtToken: string;
}

const InvitationPanel: React.FC = () => {
  const { user, students, setStudents, setSnackbarErrorMsg } =
    useContext(AppContext);
  const { inviteId } = useParams();
  const [invitation, setInvitation] = useState<{
    user: User | null;
    students: Student[];
  }>();

  const siblings = students.filter(s => s.parents.includes(user.id))

  const navigate = useNavigate();

  const handleAcceptInvitation = async () => {
    try {
      const newStudents = await acceptInvitation(inviteId!);
      setStudents(students.concat(newStudents));
      navigate("/");
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

  useEffect(() => {
    const fetchInvitation = async () => {
      const invitation = await getInvitation(inviteId!);
      setInvitation(invitation);
    };
    fetchInvitation();
  }, []);

  let buttons = <></>;
  let body = (
    <Typography textAlign="center">
      {!invitation
        ? "Please wait while we look up your invitation..."
        : "Unable to find invitation."}
    </Typography>
  );

  if (invitation?.user) {
    if (user.id) {
      const newStudents = invitation.students.filter(
        (invitedStudent) =>
          !siblings.find((student) => {
            if (invitedStudent.studentId.length && student.studentId.length) {
              return invitedStudent.studentId === student.studentId;
            } else {
              return (
                invitedStudent.firstName.toLowerCase() === student.firstName.toLowerCase() &&
                invitedStudent.lastName.toLowerCase() === student.lastName.toLowerCase()
              );
            }
          })
      );
      if (newStudents.length) {
        const studentNames = newStudents
          .map((student) => student.firstName + " " + student.lastName)
          .join(", ");
        body = (
          <Typography textAlign="center">
            You&apos;re invited to add the following student
            {newStudents.length > 1 ? "s" : ""} to your account:{" "}
            <Typography component="span" fontWeight="bold">
              {studentNames}
            </Typography>
            . Please ignore if you can already order lunches for{" "}
            {newStudents.length > 1
              ? "all the students listed"
              : "this student"}
            .
          </Typography>
        );
        buttons = (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
              justifyContent: "center",
            }}
          >
            <Button variant="contained" onClick={handleAcceptInvitation}>
              Add Student{newStudents.length > 1 ? "s" : ""}
            </Button>
            <Button variant="contained" onClick={() => navigate("/")}>
              No, Thank You
            </Button>
          </Box>
        );
      } else {
        body = (
          <Typography textAlign="center">
            You may ignore this invitation as it does not appear to add any new
            students to your existing account.
          </Typography>
        );
        buttons = (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
              justifyContent: "center",
            }}
          >
            <Button variant="contained" onClick={() => navigate("/")}>
              OK
            </Button>
          </Box>
        );
      }
    } else {
      if (invitation.students.length) {
        const studentNames = invitation.students
          .map((student) => student.firstName + " " + student.lastName)
          .join(", ");
        body = (
          <Typography textAlign="center">
            Login or create an account to order lunches for the following
            student{invitation.students.length > 1 ? "s" : ""}:{" "}
            <Typography component="span" fontWeight="bold">
              {studentNames}
            </Typography>
            . Please ignore if you can already order lunches for{" "}
            {invitation.students.length > 1
              ? "all the students listed"
              : "this student"}
            . You may receive other invitations
            for any additional students you may have.
          </Typography>
        );
        buttons = (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate(LOGIN_URL + "/" + inviteId)}
            >
              Login
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(REGISTRATION_URL + "/" + inviteId)}
            >
              Create Account
            </Button>
            <Button variant="contained" onClick={() => navigate("/")}>
              No, Thank You
            </Button>
          </Box>
        );
      } else {
        body = (
          <Typography textAlign="center">
            If you would like to order student lunches online, and do not yet
            have a lunch system account, click below.
          </Typography>
        );
        buttons = (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate(REGISTRATION_URL + "/" + inviteId)}
            >
              Create Account
            </Button>
            <Button variant="contained" onClick={() => navigate("/")}>
              No, Thank You
            </Button>
          </Box>
        );
      }
    }
  }

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
            Student Lunch System Invitation
          </Typography>
          {body}
          {buttons}
        </Box>
      </Box>
    </Box>
  );
};
export default InvitationPanel;
