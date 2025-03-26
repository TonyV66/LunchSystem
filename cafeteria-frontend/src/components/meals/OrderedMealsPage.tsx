import React, { useContext } from "react";
import { Box, Fab, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import MenuItemTypesLegend from "../menus/MenuItemTypesLegend";
import { CALENDAR_URL } from "../../MainAppPanel";
import { useNavigate } from "react-router-dom";
import OrderedMealsTable from "./OrderedMealsTable";
import { DateTimeUtils } from "../../DateTimeUtils";
import { AddShoppingCart } from "@mui/icons-material";

const OrderedMealsPage: React.FC = () => {
  const { orders } = useContext(AppContext);
  const navigate = useNavigate();

  const handleOrder = () => {
    navigate(CALENDAR_URL);
  };

  return (
    <Box
      sx={{ pt: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1 }}
    >
      <Box
        sx={{
          pl: 2,
          pr: 2,
          display: "flex",
          flexWrap: "wrap-reverse",
          flexDirection: "row",
          gap: 1,
          justifyContent: "flex-end",
        }}
      >
        <Box flexGrow={1}>
          <Typography fontWeight="bold" mb={1}>Upcoming Ordered Meals</Typography>
          <MenuItemTypesLegend />
        </Box>
        <Fab
          size="small"
          onClick={handleOrder}
          color="primary"
        >
          <AddShoppingCart />
        </Fab>
      </Box>

      <Box sx={{ pl: 2, pr: 2, overflowX: "auto" }}>
        <Box minWidth={"600px"}>
          <OrderedMealsTable
            startDate={DateTimeUtils.toString(new Date())}
            orders={orders}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default OrderedMealsPage;
