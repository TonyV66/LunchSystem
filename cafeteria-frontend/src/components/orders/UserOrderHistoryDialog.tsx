import * as React from "react";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  IconButton,
  Link,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { AppContext } from "../../AppContextProvider";
import { Close } from "@mui/icons-material";
import OrderedMealsTable from "../meals/OrderedMealsTable";
import { TransitionProps } from "@mui/material/transitions";
import User, { Role } from "../../models/User";
import OrderHistoryTable from "./OrderHistoryTable";
import OrderedMealsTableHeader from "./OrderedMealsTableHeader";
import CancelOrderDialog from "./CancelOrderDialog";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const UserOrderHistoryDialog: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const [orderDetailsId, setOrderDetailsId] = useState<number>();
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  const { orders, user: loggedInUser } = useContext(AppContext);

  const order = orders.find((order) => order.id === orderDetailsId);
  const canCancelOrder =
    loggedInUser?.role === Role.ADMIN &&
    order?.meals.some((meal) => !meal.cancelled);

  const handleCancelOrder = () => {
    setCancelDialogOpen(true);
  };

  return (
    <>
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
              {orderDetailsId
                ? "Order #" + orderDetailsId
                : "Order History - " + user.userName}
            </Typography>
            {!!orderDetailsId && (
              <Link
                color="inherit"
                onClick={() => {
                  setOrderDetailsId(undefined);
                }}
                component="button"
              >
                Back To Order History
              </Link>
            )}
            {!!orderDetailsId && canCancelOrder && (
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
        <Box flexGrow={1} p={2}>
          <OrderHistoryTable
            hidden={orderDetailsId ? true : false}
            user={user}
            onShowOrder={setOrderDetailsId}
          />
          {orderDetailsId ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <OrderedMealsTableHeader
                order={orders.find((order) => order.id === orderDetailsId)!}
              />
              <OrderedMealsTable
                order={orders.find((order) => order.id === orderDetailsId)}
                hideDate={false}
                hidePrice={false}
              ></OrderedMealsTable>
            </Box>
          ) : (
            <></>
          )}
        </Box>
      </Dialog>
      {!!order && cancelDialogOpen && (
        <CancelOrderDialog
          onClose={() => setCancelDialogOpen(false)}
          order={order}
        />
      )}
    </>
  );
};
