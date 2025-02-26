import React from "react";
import {
  Box,
  Typography,
} from "@mui/material";
import ChangePasswordPanel from "./ChangePasswordPanel";

const ChangePasswordPage: React.FC = () => {
  return (
    <Box p={1} >
      <Typography variant="h6" sx={{mb: 1}}>Change Password</Typography>
      <ChangePasswordPanel/>
    </Box>
  );
};

export default ChangePasswordPage;
