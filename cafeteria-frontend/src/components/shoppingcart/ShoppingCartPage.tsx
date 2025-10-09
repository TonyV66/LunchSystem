import React from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CALENDAR_URL, MEALS_URL } from "../../MainAppPanel";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../AppContextProvider";
import { checkout, getSavedCards } from "../../api/CafeteriaClient";
import { CreditCard as SavedCreditCard } from "../../models/CreditCard";
import { GiftCard as SavedGiftCard } from "../../models/GiftCard";
import ShoppingCartTable from "./ShoppingCartTable";
import CheckoutForm from "./CheckoutForm";
import { AxiosError } from "axios";
import ConfirmDialog from "../ConfirmDialog";
import { Role } from "../../models/User";

const ShoppingCartPage: React.FC = () => {
  const {
    shoppingCart,
    user,
    setUser,
    orders,
    setOrders,
    school,
    setShoppingCart,
    scheduledMenus,
    setSnackbarErrorMsg,
    students,
  } = useContext(AppContext);

  type PaymentMethod = "creditcard" | "giftcard" | "donate";

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("creditcard");
  const [useCredits, setUseCredits] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  // const [useCredits, setUseCredits] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [savedCreditCards, setSavedCreditCards] = useState<SavedCreditCard[]>(
    []
  );
  const [savedGiftCards, setSavedGiftCards] = useState<SavedGiftCard[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const getCards = async () => {
      try {
        const cards = await getSavedCards();
        if (cards.creditCards.length) {
          setSavedCreditCards(cards.creditCards);
        }
        if (cards.giftCards.length) {
          setSavedGiftCards(cards.giftCards);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        /* empty */
      }
    };

    if (
      shoppingCart.items
        .filter((item) => item.studentId)
        .some(
          (item) =>
            !students
              .find((s) => s.id === item.studentId)
              ?.parents.includes(user.id)
        )
    ) {
      return;
    }

    getCards();
  }, []);

  useEffect(() => {
    if (!showThankYou && !shoppingCart.items.length) {
      navigate(CALENDAR_URL);
    }
  }, [shoppingCart]);

  const handleCheckout = async (paymentToken: string) => {
    try {
      const completedOrder = await checkout(
        useCredits,
        paymentToken,
        shoppingCart,
        saveCard
      );

      if (useCredits) {
        setUser({...user, availableCredits: Math.max(0, user.availableCredits - completedOrder.appliedCredits)});
      }

      setOrders(orders.concat(completedOrder));
      setShowThankYou(true);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error occurred while checking out: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const handleThankYouClose = () => {
    setShoppingCart({ items: [] });
    setShowThankYou(false);
    navigate(MEALS_URL);
  };

  const handlePaymentChanged = (paymentMethod: string) => {
    if (paymentMethod !== "giftcard" && paymentMethod !== "creditcard") {
      setSaveCard(false);
    }
    setPaymentMethod(paymentMethod as PaymentMethod);
  };

  const handleDonationChange = (checked: boolean) => {
    if (checked) {
      setPaymentMethod("donate");
      setSaveCard(false);
    } else {
      setPaymentMethod("creditcard");
    }
  };

  const handleUseCreditsChange = (checked: boolean) => {
    setUseCredits(checked);
  };

  let total = shoppingCart.items
    .map((item) => {
      const menu = scheduledMenus.find((menu) => menu.id == item.dailyMenuId)!;
      return item.isDrinkOnly ? menu.drinkOnlyPrice : menu.price;
    })
    .reduce((p1, p2) => p1 + p2, 0);
  if (useCredits) {
    total = Math.max(0, total - user.availableCredits);
  }

  return (
    <Box
      sx={{
        maxHeight: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <ShoppingCartTable
        hidePrice={paymentMethod === "donate"}
        editable={true}
      ></ShoppingCartTable>

      <Stack direction="column" gap={4} alignItems="center">
        <Stack>
          {user.role === Role.ADMIN && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={paymentMethod === "donate"}
                  onChange={(e) => handleDonationChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  This meal is being donated
                </Typography>
              }
            />
          )}

          {user.availableCredits > 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={useCredits}
                  disabled={paymentMethod === "donate"}
                  onChange={(e) => handleUseCreditsChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Use my credits (Avail.: ${user.availableCredits.toFixed(2)})
                </Typography>
              }
            />
          )}
        </Stack>

        {paymentMethod === "donate" || total === 0 ? (
          <Button
            variant="contained"
            onClick={() => handleCheckout(paymentMethod)}
          >
            Submit Order
          </Button>
        ) : (
          <CheckoutForm
            school={school}
            user={user}
            selectedCard={paymentMethod}
            total={total}
            saveCard={saveCard}
            sendEmail={sendEmail}
            savedCreditCards={savedCreditCards}
            savedGiftCards={savedGiftCards}
            onCardSelected={handlePaymentChanged}
            onSaveCardChange={setSaveCard}
            onSendEmailChange={user.email?.length ? setSendEmail : undefined}
            onTokenReceived={(tokenResult, buyer) => {
              const result = tokenResult as { status: string; token?: string };
              if (result.status !== "OK") {
                console.log("Tokenization failed");
              } else {
                console.log(buyer);
                handleCheckout(result.token!);
              }
            }}
          />
        )}
      </Stack>

      {showThankYou && (
        <ConfirmDialog
          open={true}
          onOk={handleThankYouClose}
          hideCancelButton={true}
          onCancel={handleThankYouClose}
          title="Thank You For Your Order"
        >
          <Typography>
            Your order has been successfully placed. Click OK to view your
            upcoming ordered meals.
          </Typography>
        </ConfirmDialog>
      )}
    </Box>
  );
};

export default ShoppingCartPage;
