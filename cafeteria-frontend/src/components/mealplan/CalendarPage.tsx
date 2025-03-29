import React, { useContext, useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import MealCalendar from "./MealCalendar";
import MealStatusLegend from "../MealStatusLegend";
import { AppContext } from "../../AppContextProvider";
import { Role } from "../../models/User";
import { useNavigate } from "react-router-dom";
import { CART_URL } from "../../MainAppPanel";

const CalendarPage: React.FC = () => {
  const { user, shoppingCart } = useContext(AppContext);
  const [checkoutDisabled, setCheckoutDisabled] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    setCheckoutDisabled(!shoppingCart.items.length);
  }, [shoppingCart]);

  return (
    <Box
      pt={1}
      pb={1}
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {user.role === Role.PARENT ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap-reverse",
            alignItems: "center",
            justifyContent: "flex-end",
            columnGap: 1,
            pl: 2,
            pr: 2,
            pt: user.role === Role.PARENT ? 1 : 2,
            pb: user.role === Role.PARENT ? 1 : undefined,
          }}
        >
          <Box flexGrow={1}>
            <Typography fontWeight="bold" mb={1}>
              Scheduled Meals
            </Typography>
            <MealStatusLegend></MealStatusLegend>
          </Box>
          <Box>
            <Button
              onClick={() => navigate(CART_URL)}
              disabled={checkoutDisabled}
              color="primary"
              size="small"
              variant="contained"
            >
              Checkout
            </Button>
          </Box>
        </Box>
      ) : (
        <></>
      )}

      <Box
        sx={{
          flexGrow: 1,
          overflowX: "auto",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            pl: 2,
            pb: 2,
            pr: 2,
          }}
        >
          <MealCalendar />
        </Box>
      </Box>
    </Box>
  );
};

export default CalendarPage;
