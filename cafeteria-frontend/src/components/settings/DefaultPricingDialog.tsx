import React, { useContext, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Input,
  InputAdornment,
  InputLabel,
  Stack,
} from "@mui/material";
import School from "../../models/School";
import { AppContext } from "../../AppContextProvider";
import { updateSchoolPrices } from "../../api/CafeteriaClient";

interface DefaultPricingDialogProps {
  open: boolean;
  onClose: () => void;
}

const DefaultPricingDialog: React.FC<DefaultPricingDialogProps> = ({
  open,
  onClose,
}) => {
  const {school, setSchool} = useContext(AppContext)
  const [mealPrice, setMealPrice] = useState(school.mealPrice.toFixed(2));
  const [drinkOnlyPrice, setDrinkOnlyPrice] = useState(
    school.drinkOnlyPrice.toFixed(2)
  );

  const handleSave = async () => {
    const updatedSchool: School = {
      ...school,
      mealPrice: parseFloat(mealPrice),
      drinkOnlyPrice: parseFloat(drinkOnlyPrice),
    };
    await updateSchoolPrices(updatedSchool);
    setSchool(updatedSchool);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Default Pricing</DialogTitle>
      <DialogContent>
        <Stack direction="column" gap={2} sx={{ mt: 2 }}>
          <FormControl>
            <InputLabel htmlFor="outlined-adornment-amount">
              Meal Price
            </InputLabel>
            <Input
              id="outlined-adornment-amount"
              startAdornment={
                <InputAdornment position="start">$</InputAdornment>
              }
              value={mealPrice}
              onChange={(e) => setMealPrice(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <InputLabel htmlFor="outlined-adornment-amount">
              Drink Only Price
            </InputLabel>
            <Input
              id="outlined-adornment-amount-2"
              startAdornment={
                <InputAdornment position="start">$</InputAdornment>
              }
              value={drinkOnlyPrice}
              onChange={(e) => setDrinkOnlyPrice(e.target.value)}
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DefaultPricingDialog; 