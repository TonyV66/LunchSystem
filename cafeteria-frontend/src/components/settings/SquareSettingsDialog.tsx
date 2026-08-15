import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { AppContext } from "../../AppContextProvider";
import { updateSchoolSquare } from "../../api/CafeteriaClient";
import School from "../../models/School";

interface SquareSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SquareSettingsDialog: React.FC<SquareSettingsDialogProps> = ({
  open,
  onClose,
}) => {
  const { school, setSchool } = useContext(AppContext);
  const [squareAppId, setSquareAppId] = useState(school.squareAppId);
  const [squareAppAccessToken, setSquareAppAccessToken] = useState(
    school.squareAppAccessToken,
  );
  const [squareLocationId, setSquareLocationId] = useState(
    school.squareLocationId,
  );
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!school) return;

    setIsLoading(true);
    try {
      const updatedSchool: School = {
        ...school,
        squareAppId,
        squareAppAccessToken,
        squareLocationId,
      };

      await updateSchoolSquare(updatedSchool);
      setSchool(updatedSchool);
      onClose();
    } catch (error) {
      console.error("Error updating Square settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSquareAppId(school.squareAppId);
    setSquareAppAccessToken(school.squareAppAccessToken);
    setSquareLocationId(school.squareLocationId);
    setShowAccessToken(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Square Payment Configuration</DialogTitle>
      <DialogContent>
        <Stack direction="column" gap={3} sx={{ mt: 1 }}>
          <TextField
            label="Square Application ID"
            value={squareAppId}
            variant="standard"
            onChange={(e) => setSquareAppId(e.target.value)}
            fullWidth
            helperText="Your Square application ID"
          />

          <TextField
            label="Square Access Token"
            value={squareAppAccessToken}
            variant="standard"
            onChange={(e) => setSquareAppAccessToken(e.target.value)}
            fullWidth
            type={showAccessToken ? "text" : "password"}
            helperText="Your Square access token (will be hidden for security)"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label={
                        showAccessToken
                          ? "Hide access token"
                          : "Show access token"
                      }
                      onClick={() => setShowAccessToken((show) => !show)}
                      edge="end"
                    >
                      {showAccessToken ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Square Location ID"
            value={squareLocationId}
            variant="standard"
            onChange={(e) => setSquareLocationId(e.target.value)}
            fullWidth
            helperText="Your Square location ID"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SquareSettingsDialog;
