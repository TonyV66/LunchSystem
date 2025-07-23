import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Alert,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import UserImportDialog from "./UserImportDialog";

const UserImportTest: React.FC = () => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<string | null>(null);

  const handleImportComplete = (importedCount: number) => {
    setLastImportResult(`Successfully imported ${importedCount} users!`);
  };

  const handleOpenImportDialog = () => {
    setShowImportDialog(true);
    setLastImportResult(null);
  };

  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <Stack spacing={3}>
          <Typography variant="h4" gutterBottom>
            User Import Test
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            This component allows you to test the CSV import functionality for users.
            Upload a CSV file with parent information to create new users in the system.
          </Typography>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>CSV Format Required:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
              <li>First column: Parent First Name</li>
              <li>Second column: Parent Last Name</li>
              <li>Third column: Parent Email</li>
              <li>Include a header row (will be skipped)</li>
            </Typography>
          </Alert>

          <Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenImportDialog}
              size="large"
            >
              Import Users from CSV
            </Button>
          </Box>

          {lastImportResult && (
            <Alert severity="success">
              {lastImportResult}
            </Alert>
          )}

          <Box>
            <Typography variant="h6" gutterBottom>
              Example CSV Content:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
              <Typography variant="body2" fontFamily="monospace">
                Parent First Name,Parent Last Name,Parent Email<br />
                John,Doe,john.doe@example.com<br />
                Jane,Smith,jane.smith@example.com<br />
                Mike,Johnson,mike.johnson@example.com
              </Typography>
            </Paper>
          </Box>
        </Stack>
      </Paper>

      <UserImportDialog
        open={showImportDialog}
        onClose={handleCloseImportDialog}
        onImportComplete={handleImportComplete}
      />
    </Box>
  );
};

export default UserImportTest; 