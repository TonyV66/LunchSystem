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
import { grey } from "@mui/material/colors";
import { CreditCard as SavedCreditCard } from "../../models/CreditCard";
import { GiftCard as SavedGiftCard } from "../../models/GiftCard";

interface PaymentOptionsProps {
  onCardSelected: (selectedCard: string) => void;
  onSendEmail?: (save: boolean) => void;
  onDonate?: () => void;
  sendEmail: boolean;
  selectedCard: string;
  savedGiftCards: SavedGiftCard[];
  savedCreditCards: SavedCreditCard[];
  disabled?: boolean;
  showDonateOption?: boolean;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  onCardSelected,
  onSendEmail,
  onDonate,
  sendEmail,
  selectedCard,
  savedCreditCards,
  savedGiftCards,
  disabled,
  showDonateOption,
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
                  disabled={disabled}
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
        {showDonateOption ? (
          <ListItem disablePadding>
            <ListItemButton
              role={undefined}
              onClick={() => onCardSelected("donate")}
            >
              <ListItemIcon sx={{ minWidth: "0px" }}>
                <Radio
                  sx={{
                    paddingLeft: "0px",
                    paddingTop: "0px",
                    paddingBottom: "0px",
                  }}
                  size="small"
                  checked={selectedCard === "donate"}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ "aria-labelledby": "donateLabel" }}
                />
              </ListItemIcon>
              <ListItemText
                id="donateLabel"
                primary="Free Meal"
              />
            </ListItemButton>
          </ListItem>
        ) : null}
      </List>
      {selectedCard === "donate" ? (
        <Button
          sx={{ mt: 1, alignSelf: "flex-start" }}
          variant="contained"
          onClick={onDonate}
        >
          Process Donation
        </Button>
      ) : onSendEmail ? (
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

export default PaymentOptions;
