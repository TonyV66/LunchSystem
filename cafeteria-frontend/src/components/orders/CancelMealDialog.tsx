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
import { cancelMeal } from "../../api/CafeteriaClient";
import Meal from "../../models/Meal";
import { Role } from "../../models/User";

interface CancelMealDialogProps {
  onClose: () => void;
  meal: Meal;
}

const CancelMealDialog: React.FC<CancelMealDialogProps> = ({
  onClose,
  meal,
}) => {
  const {
    orders,
    setOrders,
    setSnackbarMsg,
    setSnackbarErrorMsg,
    user,
    setUser,
  } = useContext(AppContext);
  const isAdmin = user.role === Role.ADMIN;
  const [issueCredits, setIssueCredits] = React.useState(!isAdmin);

  const mealValue = meal.items.reduce((total, item) => {
    return total + item.price;
  }, 0);

  const handleConfirm = async () => {
    try {
      const response = await cancelMeal(meal.id, isAdmin ? issueCredits : true);
      setUser({ ...user, availableCredits: response.availableCredits });
      setOrders(
        orders.map((o) => (o.id === response.order.id ? response.order : o))
      );
      setSnackbarMsg("Meal cancelled successfully");
      onClose();
    } catch (error) {
      console.error("Error cancelling meal:", error);
      setSnackbarErrorMsg("Error cancelling meal");
    }
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Cancel Meal</DialogTitle>
      <DialogContent>
        <p>Are you sure you want to cancel this meal?</p>
        {isAdmin && mealValue > 0 && (
          <FormControlLabel
            control={
              <Checkbox
                checked={issueCredits}
                onChange={(e) => setIssueCredits(e.target.checked)}
              />
            }
            label={`Apply $${mealValue.toFixed(2)} credit to user's account`}
          />
        )}
        {!isAdmin && (
          <p>
            You will not be issued a refund. Instead, you will be issued
            {mealValue > 0 ? ` $${mealValue.toFixed(2)} in` : ""} credits that
            you can use when purchasing future meals.
          </p>
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

export default CancelMealDialog;
