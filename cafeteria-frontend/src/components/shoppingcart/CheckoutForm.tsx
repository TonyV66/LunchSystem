import React from "react";
import { Stack } from "@mui/material";
import CardCheckoutForm from "./CardCheckoutForm";
import School from "../../models/School";
import User from "../../models/User";
import { CreditCard as SavedCreditCard } from "../../models/CreditCard";
import { GiftCard as SavedGiftCard } from "../../models/GiftCard";
import PaymentOptions from "./PaymentOptions";

interface CheckoutFormProps {
  school: School;
  user: User;
  selectedCard: string;
  total: number;
  saveCard: boolean;
  sendEmail: boolean;
  savedCreditCards: SavedCreditCard[];
  savedGiftCards: SavedGiftCard[];
  onCardSelected: (selectedCard: string) => void;
  onSaveCardChange: (save: boolean) => void;
  onSendEmailChange?: (send: boolean) => void;
  onTokenReceived: (tokenResult: unknown, buyer: unknown) => void;
  onPayWithSavedCard: (cardId: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  school,
  user,
  selectedCard,
  total,
  saveCard,
  sendEmail,
  savedCreditCards,
  savedGiftCards,
  onCardSelected,
  onSaveCardChange,
  onSendEmailChange,
  onTokenReceived,
  onPayWithSavedCard,
}) => {
  return (
    <Stack
      className="checkout-form"
      direction={"row"}
      gap={2}
      justifyContent="center"
      alignItems={"stretch"}
    >
      <PaymentOptions
        sendEmail={sendEmail}
        disabled={total <= 0}
        onSendEmail={onSendEmailChange}
        onCardSelected={onCardSelected}
        savedCreditCards={savedCreditCards}
        savedGiftCards={savedGiftCards}
        selectedCard={selectedCard}
      />

      <CardCheckoutForm
        school={school}
        user={user}
        selectedCard={selectedCard}
        total={total}
        saveCard={saveCard}
        onSaveCardChange={onSaveCardChange}
        onTokenReceived={onTokenReceived}
        onPayWithSavedCard={onPayWithSavedCard}
      />
    </Stack>
  );
};

export default CheckoutForm;
