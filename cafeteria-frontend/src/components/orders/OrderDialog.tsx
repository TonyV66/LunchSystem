import * as React from "react";
import {
  AppBar,
  Dialog,
  IconButton,
  Slide,
  Stack,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import { useContext } from "react";
import { AppContext } from "../../AppContextProvider";
import { Close } from "@mui/icons-material";
import OrderedMealsTable from "../meals/OrderedMealsTable";
import { TransitionProps } from "@mui/material/transitions";
import { Role } from "../../models/User";
import CancelOrderDialog from "./CancelOrderDialog";
import OrderedMealsTableHeader from "./OrderedMealsTableHeader";

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
  const { orders, user: loggedInUser } = useContext(AppContext);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  const order = orders.find((order) => order.id === orderId)!;

  const handleCancelOrder = () => {
    setCancelDialogOpen(true);
  };

  const canCancelOrder =
    loggedInUser?.role === Role.ADMIN &&
    order.meals.some((meal) => !meal.cancelled);

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
          {canCancelOrder && (
            <Button
              color="error"
              variant="contained"
              onClick={handleCancelOrder}
              sx={{ ml: 2 }}
            >
              Cancel Order
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Stack p={2} gap={2}>
        <OrderedMealsTableHeader order={order} />
        <OrderedMealsTable order={order}></OrderedMealsTable>
      </Stack>

      {cancelDialogOpen && (
        <CancelOrderDialog
          onClose={() => setCancelDialogOpen(false)}
          order={order}
        />
      )}
    </Dialog>
  );
};
