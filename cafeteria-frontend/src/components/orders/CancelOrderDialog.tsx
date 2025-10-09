import React, { useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { cancelOrder } from "../../api/CafeteriaClient";
import { Order } from "../../models/Order";

interface CancelOrderDialogProps {
  onClose: () => void;
  order: Order;
}

const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  onClose,
  order,
}) => {
  const {
    orders,
    setOrders,
    setSnackbarMsg,
    setSnackbarErrorMsg,
    user,
    setUser,
  } = useContext(AppContext);
  const [issueCredits, setIssueCredits] = React.useState(false);

  const orderValue = !order
    ? 0
    : order.meals
        .filter((meal) => !meal.cancelled)
        .reduce((total, meal) => {
          return (
            total +
            meal.items.reduce((mealTotal, item) => {
              return mealTotal + item.price;
            }, 0)
          );
        }, 0);

  const handleConfirm = async () => {
    try {
      const response = await cancelOrder(order.id, issueCredits);
      setUser({ ...user, availableCredits: response.availableCredits });
      setOrders(
        orders.map((o) => (o.id === response.order.id ? response.order : o))
      );
      setSnackbarMsg("Order cancelled successfully");
      onClose();
    } catch (error) {
      console.error("Error cancelling order:", error);
      setSnackbarErrorMsg("Error cancelling order");
    }
  };
  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Cancel Order</DialogTitle>
      <DialogContent>
        <p>Are you sure you want to cancel this order?</p>
        {orderValue > 0 && (
          <FormControlLabel
            control={
              <Checkbox
                checked={issueCredits}
                onChange={(e) => setIssueCredits(e.target.checked)}
              />
            }
            label={`Apply $${orderValue.toFixed(2)} credit to user's account`}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">
          Confirm Cancellation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelOrderDialog;
