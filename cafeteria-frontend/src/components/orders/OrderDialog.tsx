import * as React from "react";
import {
  AppBar,
  Dialog,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { AppContext } from "../../AppContextProvider";
import { Close } from "@mui/icons-material";
import OrderedMealsTable from "../meals/OrderedMealsTable";
import { TransitionProps } from "@mui/material/transitions";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const OrderDialog: React.FC<{
  orderId: number;
  onClose: () => void;
}> = ({ orderId, onClose }) => {
  const { orders, students } = useContext(AppContext);
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
      <OrderedMealsTable
        students={students} orders={orders.filter((order) => order.id === orderId)}
      ></OrderedMealsTable>
    </Dialog>
  );
};