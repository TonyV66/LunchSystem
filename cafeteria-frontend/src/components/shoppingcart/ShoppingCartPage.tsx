import React from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CALENDAR_URL, MEALS_URL } from "../../MainAppPanel";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../AppContextProvider";
import { checkout, getSavedCards } from "../../api/CafeteriaClient";
import {
  CreditCard,
  GiftCard,
  PaymentForm,
} from "react-square-web-payments-sdk";
import { CreditCard as SavedCreditCard } from "../../models/CreditCard";
import { GiftCard as SavedGiftCard } from "../../models/GiftCard";

import ShoppingCartTable from "./ShoppingCartTable";
import { AxiosError } from "axios";
import { grey } from "@mui/material/colors";

const PaymentOptions: React.FC<{
  onCardSelected: (selectedCard: string) => void;
  onSendEmail?: (save: boolean) => void;
  sendEmail: boolean;
  selectedCard: string;
  savedGiftCards: SavedGiftCard[];
  savedCreditCards: SavedCreditCard[];
}> = ({
  onCardSelected,
  onSendEmail,
  sendEmail,
  selectedCard,
  savedCreditCards,
  savedGiftCards,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography fontWeight="bold" variant="body1">
        Payment Method
      </Typography>

      <List
        dense={true}
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          borderWidth: 1,
          borderColor: grey[300],
          borderStyle: "solid",
        }}
      >
        {savedCreditCards.map((cc) => (
          <ListItem key={cc.id} disablePadding>
            <ListItemButton
              role={undefined}
              onClick={() => onCardSelected(cc.id)}
            >
              <ListItemIcon sx={{ minWidth: "0px" }}>
                <Radio
                  sx={{
                    paddingLeft: "0px",
                    paddingTop: "0px",
                    paddingBottom: "0px",
                  }}
                  size="small"
                  checked={selectedCard === cc.id}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ "aria-labelledby": "creditCardLabel" }}
                />
              </ListItemIcon>
              <ListItemText
                id="creditCardLabel"
                primary={
                  cc.cardBrand +
                  " ..." +
                  cc.last4 +
                  " (exp. " +
                  cc.expMonth +
                  "/" +
                  cc.expYear +
                  ")"
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton
            role={undefined}
            onClick={() => onCardSelected("creditcard")}
          >
            <ListItemIcon sx={{ minWidth: "0px" }}>
              <Radio
                sx={{
                  paddingLeft: "0px",
                  paddingTop: "0px",
                  paddingBottom: "0px",
                }}
                size="small"
                checked={selectedCard === "creditcard"}
                tabIndex={-1}
                disableRipple
                inputProps={{ "aria-labelledby": "creditCardLabel" }}
              />
            </ListItemIcon>
            <ListItemText
              id="creditCardLabel"
              primary={
                savedCreditCards.length ? "Other Credit Card" : "Credit Card"
              }
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            role={undefined}
            onClick={() => onCardSelected("giftcard")}
          >
            <ListItemIcon sx={{ minWidth: "0px" }}>
              <Radio
                sx={{
                  paddingLeft: "0px",
                  paddingTop: "0px",
                  paddingBottom: "0px",
                }}
                size="small"
                checked={selectedCard === "giftcard"}
                tabIndex={-1}
                disableRipple
                inputProps={{ "aria-labelledby": "giftCardLabel" }}
              />
            </ListItemIcon>
            <ListItemText
              id="giftCardLabel"
              primary={savedGiftCards.length ? "Other Gift Card" : "Gift Card"}
            />
          </ListItemButton>
        </ListItem>
      </List>
      {onSendEmail ? (
        <FormControlLabel
          sx={{ mt: 1 }}
          label={<Typography variant="subtitle2">Email Receipt</Typography>}
          control={
            <Checkbox
              sx={{ p: 0, pr: 1, pl: 1 }}
              checked={sendEmail}
              onChange={() => onSendEmail(!sendEmail)}
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

const ShoppingCartPage: React.FC = () => {
  const {
    shoppingCart,
    user,
    orders,
    setOrders,
    school,
    setShoppingCart,
    scheduledMenus,
    setSnackbarErrorMsg,
  } = useContext(AppContext);

  const [selectedCard, setSelectedCard] = useState("creditcard");
  const [showThankYou, setShowThankYou] = useState(false);
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
        paymentToken,
        shoppingCart,
        saveCard
      );

      setOrders(orders.concat(completedOrder));
      setShoppingCart({ items: [] });
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

  const handlePaymentChanged = (paymentMethod: string) => {
    if (paymentMethod !== "giftcard" && paymentMethod !== "creditcard") {
      setSaveCard(false);
    }
    setSelectedCard(paymentMethod);
  };

  const total = shoppingCart.items
    .map((item) => {
      const menu = scheduledMenus.find((menu) => menu.id == item.dailyMenuId)!;
      return item.isDrinkOnly ? menu.drinkOnlyPrice : menu.price;
    })
    .reduce((p1, p2) => p1 + p2, 0);

  if (showThankYou) {
    return (
      <Box
        sx={{
          maxHeight: "100%",
          pt: 2,
          pb: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Thank You For Your Order
        </Typography>
        <Button variant="contained" onClick={() => navigate(MEALS_URL)}>
          Show All My Upcoming Ordered Meals
        </Button>
      </Box>
    );
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
      <ShoppingCartTable editable={true}></ShoppingCartTable>
      {selectedCard === "giftcard" || selectedCard === "creditcard" ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <PaymentOptions
            sendEmail={sendEmail}
            onSendEmail={user.email?.length ? setSendEmail : undefined}
            onCardSelected={handlePaymentChanged}
            savedCreditCards={savedCreditCards}
            savedGiftCards={savedGiftCards}
            selectedCard={selectedCard}
          />

          <Box>
            <Box>
              <Typography fontWeight="bold" variant="body1">
                Total: ${total.toFixed(2)}
              </Typography>
              <PaymentForm
                applicationId={school.squareAppId}
                locationId={school.squareLocationId}
                cardTokenizeResponseReceived={(tokenResult, buyer) => {
                  if (tokenResult.status !== "OK") {
                    console.log("Tokenization failed");
                  } else {
                    console.log(buyer);
                    handleCheckout(tokenResult.token!);
                  }
                }}
              >
                {selectedCard === "giftcard" ? <GiftCard /> : <CreditCard />}
              </PaymentForm>
              {user.firstName.length &&
              user.lastName.length &&
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
                        selectedCard != "creditcard" &&
                        selectedCard != "giftcard"
                      }
                      checked={saveCard}
                      onChange={() => setSaveCard(!saveCard)}
                      size="small"
                    />
                  }
                />
              ) : (
                <></>
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <PaymentOptions
              sendEmail={sendEmail}
              onSendEmail={user.email.length ? setSendEmail : undefined}
              onCardSelected={handlePaymentChanged}
              savedCreditCards={savedCreditCards}
              savedGiftCards={savedGiftCards}
              selectedCard={selectedCard}
            />
            <Button
              variant="contained"
              onClick={() => handleCheckout(selectedCard)}
            >
              Pay ${total.toFixed(2)}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ShoppingCartPage;
