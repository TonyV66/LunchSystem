import React from "react";
import "./App.css";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CALENDAR_URL, MEALS_URL } from "./MainAppPanel";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "./AppContextProvider";
import { checkout } from "./services/AdminClientServices";
import {
  CreditCard,
  GiftCard,
  PaymentForm,
} from "react-square-web-payments-sdk";
import ShoppingCartTable from "./ShoppingCartTable";

const ShoppingCartPage: React.FC = () => {
  const {
    shoppingCart,
    orders,
    setOrders,
    systemDefaults,
    setShoppingCart,
    scheduledMenus,
  } = useContext(AppContext);

  const [paymentType, setPaymentType] = useState("creditcard");

  const navigate = useNavigate();

  useEffect(() => {
    if (!shoppingCart.items.length) {
      navigate(CALENDAR_URL);
    }
  }, [shoppingCart]);

  const handleCheckout = async (paymentToken: string) => {
    const savedOrder = await checkout(paymentToken, shoppingCart);

    setOrders(orders.concat(savedOrder));
    setShoppingCart({ items: [] });

    navigate(MEALS_URL);
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

  return (
    <Box
      sx={{ maxHeight: '100%', pt: 2, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}
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
              applicationId={systemDefaults.squareAppId}
              locationId={systemDefaults.squareLocationId}
              cardTokenizeResponseReceived={(tokenResult, buyer) => {
                console.log(buyer);
                handleCheckout(tokenResult.token!);
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
