import React from "react";
import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CALENDAR_URL, MEALS_URL } from "../../MainAppPanel";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../AppContextProvider";
import { checkout } from "../../api/CafeteriaClient";
import {
  CreditCard,
  GiftCard,
  PaymentForm,
} from "react-square-web-payments-sdk";
import ShoppingCartTable from "./ShoppingCartTable";
import { AxiosError } from "axios";

const ShoppingCartPage: React.FC = () => {
  const {
    shoppingCart,
    orders,
    setOrders,
    school: schoolSettings,
    setShoppingCart,
    scheduledMenus,
    students,
    setSnackbarErrorMsg,
  } = useContext(AppContext);

  const [paymentType, setPaymentType] = useState("creditcard");
  const [showThankYou, setShowThankYou] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!showThankYou && !shoppingCart.items.length) {
      navigate(CALENDAR_URL);
    }
  }, [shoppingCart]);

  const handleCheckout = async (paymentToken: string) => {
    const studentIds = new Set(
      shoppingCart.items.map((item) => item.studentId)
    );
    const latestLunchSchedules = students
      .filter((student) => studentIds.has(student.id))
      .flatMap((student) =>
        student.lunchTimes.map((lt) => ({ ...lt, id: student.id }))
      );

    try {
      const savedOrder = await checkout(
        paymentToken,
        shoppingCart,
        latestLunchSchedules
      );

      setOrders(orders.concat(savedOrder));
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

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    paymentType: string
  ) => {
    setPaymentType(paymentType);
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
        pt: 2,
        pb: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box pl={2} pr={2} sx={{ overflowX: "auto", overflowY: "auto" }}>
        <Box sx={{ minWidth: "600px" }}>
          <ShoppingCartTable editable={true}></ShoppingCartTable>
        </Box>
      </Box>
      <Box
        sx={{
          pt: 2,
          pb: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
        }}
      >
        <Typography pr={2} variant="h6" textAlign="right">
          Total: ${total.toFixed(2)}
        </Typography>

        <ToggleButtonGroup
          color="primary"
          value={paymentType}
          exclusive
          onChange={handleChange}
          aria-label="Platform"
          sx={{}}
        >
          <ToggleButton value="creditcard">Credit Card</ToggleButton>
          <ToggleButton value="giftcard">Gift Card</ToggleButton>
        </ToggleButtonGroup>
        <Box>
          <Box>
            <PaymentForm
              applicationId={schoolSettings.squareAppId}
              locationId={schoolSettings.squareLocationId}
              cardTokenizeResponseReceived={(tokenResult, buyer) => {
                if (tokenResult.status !== 'OK') {
                  console.log("Tokenization failed")
                } else {
                  console.log(buyer);
                  handleCheckout(tokenResult.token!);
                }
              }}
            >
              {paymentType === "giftcard" ? <GiftCard /> : <CreditCard />}
            </PaymentForm>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ShoppingCartPage;
