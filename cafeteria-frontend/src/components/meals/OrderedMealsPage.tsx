import React, { useContext } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import MenuItemTypesLegend from "../menus/MenuItemTypesLegend";
import { CALENDAR_URL } from "../../MainAppPanel";
import { useNavigate } from "react-router-dom";
import OrderedMealsTable from "./OrderedMealsTable";
import { DateTimeUtils } from "../../DateTimeUtils";
import { Role } from "../../models/User";

const OrderedMealsPage: React.FC = () => {
  const { orders, students, user } = useContext(AppContext);
  const navigate = useNavigate();

  const siblings = students.filter(s => s.parents.includes(user.id))

  const handleOrder = () => {
    navigate(CALENDAR_URL);
  };

  return (
    <Box
      sx={{ pt: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1 }}
    >
      <Stack
        direction="row"
        gap={1}
        justifyContent="space-between"
        alignItems="center"
        pl={2}
        pr={2}
      >
        <Box>
          <Typography fontWeight="bold" mb={1}>
            Upcoming Meals For My Family
          </Typography>
          <MenuItemTypesLegend />
        </Box>
        {user.role !== Role.ADMIN ? (
          <Button
            size="small"
            onClick={handleOrder}
            color="primary"
            variant="contained"
          >
            Order Meals
          </Button>
        ) : (
          <></>
        )}
      </Stack>

      <Box sx={{ pl: 2, pr: 2, overflowX: "auto" }}>
        <Box minWidth={"600px"}>
          <OrderedMealsTable
            students={siblings}
            startDate={DateTimeUtils.toString(new Date())}
            orders={orders}
            highlightMealsNotOrderedByMe={true}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default OrderedMealsPage;
