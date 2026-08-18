import React from "react";
import {
  Box,
  Button,
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
import SchoolUser from "../../models/SchoolUser";
import { Role } from "../../models/User";

interface CardCheckoutFormProps {
  school: School;
  user: SchoolUser;
  selectedCard: string;
  total: number;
  saveCard: boolean;
  onSaveCardChange: (save: boolean) => void;
  onTokenReceived: (tokenResult: unknown, buyer: unknown) => void;
  onPayWithSavedCard: (cardId: string) => void;
}

const isNewCardEntry = (selectedCard: string) =>
  selectedCard === "creditcard" || selectedCard === "giftcard";

const CardCheckoutForm: React.FC<CardCheckoutFormProps> = ({
  school,
  user,
  selectedCard,
  total,
  saveCard,
  onSaveCardChange,
  onTokenReceived,
  onPayWithSavedCard,
}) => {
  const enteringNewCard = isNewCardEntry(selectedCard);
  const canSaveCard =
    user.role !== Role.ADMIN &&
    selectedCard === "creditcard" &&
    !!user.firstName?.length &&
    !!user.lastName?.length &&
    !!user.email?.length;

  return (
    <Box className="card-checkout-form">
      <Typography fontWeight="bold" variant="body1">
        Total: ${total.toFixed(2)}
      </Typography>
      {enteringNewCard ? (
        <>
          <PaymentForm
            applicationId={school.squareAppId}
            locationId={school.squareLocationId}
            cardTokenizeResponseReceived={onTokenReceived}
          >
            {selectedCard === "giftcard" ? <GiftCard /> : <CreditCard />}
          </PaymentForm>
          {canSaveCard ? (
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
                  checked={saveCard}
                  onChange={() => onSaveCardChange(!saveCard)}
                  size="small"
                />
              }
            />
          ) : null}
        </>
      ) : (
        <Button
          sx={{ mt: 1 }}
          variant="contained"
          onClick={() => onPayWithSavedCard(selectedCard)}
        >
          Pay ${total.toFixed(2)}
        </Button>
      )}
    </Box>
  );
};

export default CardCheckoutForm;
