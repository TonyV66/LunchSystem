import * as React from "react";
import {
  AppBar,
  Box,
  Dialog,
  IconButton,
  Slide,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { AppContext } from "../../AppContextProvider";
import { Close } from "@mui/icons-material";
import OrderedMealsTable from "../meals/OrderedMealsTable";
import { TransitionProps } from "@mui/material/transitions";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import User from "../../models/User";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const getUserName = (user: User | undefined) => {
  if (user) {
    return user.firstName + " " + user.lastName;
  }
  return "Unknown";
};

export const OrderDialog: React.FC<{
  orderId: number;
  onClose: () => void;
}> = ({ orderId, onClose }) => {
  const { orders, users } = useContext(AppContext);
  return (
    <Dialog
      open={true}
      fullScreen
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <Close />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Order # - {orderId}
          </Typography>
        </Toolbar>
      </AppBar>
      <Stack p={2} gap={2}>
        <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2 }}>
          <Typography fontWeight="bold">Order Date:</Typography>
          <Typography>{DateTimeUtils.toString(new Date(orders.find((order) => order.id === orderId)?.date || ""), DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}</Typography>
          <Typography fontWeight="bold">Purchaser:</Typography>
          <Typography>{getUserName(users.find((user) => user.id === orders.find((order) => order.id === orderId)?.userId))}</Typography>
        </Box>
        <OrderedMealsTable
          order={orders.find((order) => order.id === orderId)}
        ></OrderedMealsTable>
      </Stack>
    </Dialog>
  );
};
