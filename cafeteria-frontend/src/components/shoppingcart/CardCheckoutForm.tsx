import React from "react";
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  CreditCard,
  GiftCard,
  PaymentForm,
} from "react-square-web-payments-sdk";
import School from "../../models/School";
import User from "../../models/User";

interface CardCheckoutFormProps {
  school: School;
  user: User;
  selectedCard: string;
  total: number;
  saveCard: boolean;
  onSaveCardChange: (save: boolean) => void;
  onTokenReceived: (tokenResult: any, buyer: any) => void;
}

const CardCheckoutForm: React.FC<CardCheckoutFormProps> = ({
  school,
  user,
  selectedCard,
  total,
  saveCard,
  onSaveCardChange,
  onTokenReceived,
}) => {
  return (
    <Box className="card-checkout-form">
      <Typography fontWeight="bold" variant="body1">
        Total: ${total.toFixed(2)}
      </Typography>
      <PaymentForm
        applicationId={school.squareAppId}
        locationId={school.squareLocationId}
        cardTokenizeResponseReceived={onTokenReceived}
      >
        {selectedCard === "giftcard" ? <GiftCard /> : <CreditCard />}
      </PaymentForm>
      {user.firstName &&
      user.firstName.length &&
      user.lastName &&
      user.lastName.length &&
      user.email &&
      user.email.length ? (
        <FormControlLabel
          sx={{ mt: 1 }}
          label={
            <Typography variant="subtitle2">
              Save Card For Future Use
            </Typography>
          }
          control={
            <Checkbox
              sx={{ p: 0, pr: 1, pl: 1 }}
              disabled={
                selectedCard != "creditcard" && selectedCard != "giftcard"
              }
              checked={saveCard}
              onChange={() => onSaveCardChange(!saveCard)}
              size="small"
            />
          }
        />
      ) : (
        <></>
      )}
    </Box>
  );
};

export default CardCheckoutForm;
