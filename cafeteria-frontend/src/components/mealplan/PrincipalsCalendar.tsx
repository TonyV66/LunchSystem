import React, { useContext } from "react";
import {
  Box,
  Paper,
  Typography,
} from "@mui/material";import MealCalendar from "./MealCalendar";
import { AppContext } from "../../AppContextProvider";


const PrincipalsCalendar: React.FC = () => {
  const { currentSchoolYear } = useContext(AppContext);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Box
      className="plannerPage"
      sx={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr auto auto",
      }}
    >
      {currentSchoolYear.id ? (
        <Box p={1} sx={{ overflowY: "auto" }}>
          <MealCalendar />
        </Box>
      ) : (
        <Box
          p={1}
          sx={{
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              There is no active school year. Please set up a school year to
              plan meals.
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default PrincipalsCalendar;
