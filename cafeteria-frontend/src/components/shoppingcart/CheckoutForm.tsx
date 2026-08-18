import React from "react";
import { Stack } from "@mui/material";
import CardCheckoutForm from "./CardCheckoutForm";
import School from "../../models/School";
import SchoolUser from "../../models/SchoolUser";
import { CreditCard as SavedCreditCard } from "../../models/CreditCard";
import { GiftCard as SavedGiftCard } from "../../models/GiftCard";
import PaymentOptions from "./PaymentOptions";

interface CheckoutFormProps {
  school: School;
  user: SchoolUser;
  selectedCard: string;
  total: number;
  saveCard: boolean;
  sendEmail: boolean;
  savedCreditCards: SavedCreditCard[];
  savedGiftCards: SavedGiftCard[];
  showDonateOption?: boolean;
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
  showDonateOption,
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
        onDonate={() => onPayWithSavedCard("donate")}
        onCardSelected={onCardSelected}
        savedCreditCards={savedCreditCards}
        savedGiftCards={savedGiftCards}
        selectedCard={selectedCard}
        showDonateOption={showDonateOption}
      />

      {selectedCard !== "donate" ? (
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
      ) : null}
    </Stack>
  );
};

export default CheckoutForm;
