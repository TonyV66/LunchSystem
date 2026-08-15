import React, { useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Box,
  FormHelperText,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { AppContext } from "../../AppContextProvider";
import { updateSchoolRegistration } from "../../api/CafeteriaClient";
import School from "../../models/School";

type RegistrationMethod = "native" | "facts";

interface RegistrationSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const RegistrationSettingsDialog: React.FC<RegistrationSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const { school, setSchool } = useContext(AppContext);
  const [method, setMethod] = useState<RegistrationMethod>(
    school.factsApiKey ? "facts" : "native",
  );
  const [factsApiKey, setFactsApiKey] = useState(school.factsApiKey);
  const [showFactsApiKey, setShowFactsApiKey] = useState(false);
  const [registrationCode, setRegistrationCode] = useState(
    school.registrationCode,
  );
  const [openRegistration, setOpenRegistration] = useState(
    school.openRegistration,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMethod(school.factsApiKey ? "facts" : "native");
      setFactsApiKey(school.factsApiKey);
      setShowFactsApiKey(false);
      setRegistrationCode(school.registrationCode);
      setOpenRegistration(school.openRegistration);
    }
  }, [open, school]);

  const isNativeCodeValid =
    registrationCode.trim().length >= 6 &&
    registrationCode.trim().length <= 8;

  const canSave =
    method === "facts"
      ? factsApiKey.trim().length > 0
      : isNativeCodeValid;

  const handleSave = async () => {
    if (!school || !canSave) return;

    setIsLoading(true);
    try {
      const updatedSchool: School =
        method === "facts"
          ? {
              ...school,
              factsApiKey: factsApiKey.trim(),
            }
          : {
              ...school,
              factsApiKey: "",
              registrationCode,
              openRegistration,
            };

      await updateSchoolRegistration(updatedSchool);
      setSchool(updatedSchool);
      onClose();
    } catch (error) {
      console.error("Error updating registration settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setMethod(school.factsApiKey ? "facts" : "native");
    setFactsApiKey(school.factsApiKey);
    setShowFactsApiKey(false);
    setRegistrationCode(school.registrationCode);
    setOpenRegistration(school.openRegistration);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Registration Settings</DialogTitle>
      <DialogContent>
        <Stack direction="column" gap={3} sx={{ mt: 1 }}>
          <FormControl>
            <FormLabel>Registration Method</FormLabel>
            <RadioGroup
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as RegistrationMethod)
              }
            >
              <FormControlLabel
                value="native"
                control={<Radio />}
                label="Native"
              />
              <FormControlLabel
                value="facts"
                control={<Radio />}
                label="FACTS"
              />
            </RadioGroup>
          </FormControl>

          {method === "facts" ? (
            <TextField
              label="FACTS API Key"
              value={factsApiKey}
              variant="standard"
              type={showFactsApiKey ? "text" : "password"}
              onChange={(e) => setFactsApiKey(e.target.value)}
              fullWidth
              helperText="Subscription key used to call the FACTS SIS API"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label={
                          showFactsApiKey
                            ? "Hide FACTS API key"
                            : "Show FACTS API key"
                        }
                        onClick={() => setShowFactsApiKey((show) => !show)}
                        edge="end"
                      >
                        {showFactsApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          ) : (
            <>
              <TextField
                label="Registration Code"
                value={registrationCode}
                variant="standard"
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^a-zA-Z]/g, "")
                    .toUpperCase();
                  setRegistrationCode(value);
                }}
                fullWidth
                helperText="6 - 8 uppercase letters"
                error={
                  registrationCode.length > 0 &&
                  (registrationCode.length < 6 || registrationCode.length > 8)
                }
                slotProps={{
                  input: {
                    style: { textTransform: "uppercase" },
                  },
                }}
              />

              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={openRegistration}
                      onChange={(e) => setOpenRegistration(e.target.checked)}
                    />
                  }
                  label="Open Registration"
                />
                <FormHelperText>
                  If not open, invitation is required.
                </FormHelperText>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isLoading || !canSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrationSettingsDialog;
