import React, { useContext } from "react";
import { Box, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { Order } from "../../models/Order";
import User from "../../models/User";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";

const getUserName = (user: User | undefined) => {
  if (user) {
    return user.firstName + " " + user.lastName;
  }
  return "Unknown";
};

const OrderedMealsTableHeader: React.FC<{
  order: Order;
}> = ({ order }) => {
  const { users } = useContext(AppContext);

  const orderCost = order.meals.filter((meal) => !meal.cancelled || !meal.refundType).reduce((total, meal) => {
    return (
      total +
      meal.items.reduce((mealTotal, item) => {
        return mealTotal + item.price;
      }, 0)
    );
  }, 0);

  return (
    <Box className="order-meals-table-header" sx={{ alignSelf: "flex-start" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto auto auto auto",
          columnGap: 2,
        }}
      >
        <Typography fontWeight="bold">Order Date:</Typography>
        <Typography>
          {DateTimeUtils.toString(
            new Date(order.date),
            DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
          )}
        </Typography>
        <Typography fontWeight="bold">Order Total:</Typography>
        <Typography>${orderCost.toFixed(2)}</Typography>
        <Typography fontWeight="bold">Purchaser:</Typography>
        <Typography>
          {getUserName(users.find((user) => user.id === order?.userId))}
        </Typography>
        {order.appliedCredits > 0 && (
          <>
            <Typography fontWeight="bold">Credits Used:</Typography>
            <Typography>
              ${order.appliedCredits.toFixed(2)}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default OrderedMealsTableHeader;
