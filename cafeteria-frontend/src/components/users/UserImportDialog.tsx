import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Alert,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import { CloudUpload, Description, HelpOutline } from "@mui/icons-material";
import { importUsersCsv, UserImportResult } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface UserImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface CsvPreviewRow {
  role: string;
  email: string;
  firstName: string;
  lastName: string;
  parent1: string;
  parent2: string;
}

const REQUIRED_HEADERS = ["email", "firstname", "lastname", "parent1"];

const normalizeHeader = (header: string): string =>
  header.trim().toLowerCase().replace(/[\s_]+/g, "");

const UserImportHelpDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>How CSV Import Works</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            File format
          </Typography>
          <Typography variant="body2">
            Upload a CSV with a header row. Column order does not matter; columns
            are matched by name (case-insensitive).
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontFamily: "monospace" }}>
            email,firstname,lastname,parent1
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Optional columns:{" "}
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              role
            </Box>
            ,{" "}
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              parent2
            </Box>
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Required fields
          </Typography>
          <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                firstname
              </Box>{" "}
              and{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                lastname
              </Box>{" "}
              are required on every row
            </li>
            <li>
              Adults (parent, staff, teacher) require an{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                email
              </Box>
            </li>
            <li>
              Students require at least one parent email in{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                parent1
              </Box>{" "}
              or{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                parent2
              </Box>
            </li>
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Roles
          </Typography>
          <Typography variant="body2">
            Allowed values when{" "}
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              role
            </Box>{" "}
            is provided: student, parent, staff, or teacher.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            If role is omitted or blank:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
            <li>Row with an email → treated as a parent</li>
            <li>
              Row with no email but a parent email → treated as a student
            </li>
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Parents and students
          </Typography>
          <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              Parent emails on student rows must either appear as their own row
              in the CSV or already exist in the system
            </li>
            <li>A row that has both an email and a parent email is skipped</li>
            <li>
              Students are not created unless at least one parent email is
              specified
            </li>
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Matching existing records
          </Typography>
          <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
            <li>Adults are matched by email (also used as their username)</li>
            <li>
              Students are matched by first and last name plus a linked parent
              email, within the school district when applicable
            </li>
            <li>
              Import updates existing people and adds enrollments for the
              current school year; it does not remove people or enrollments that
              are missing from the file
            </li>
          </Typography>
        </Box>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained">
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

const UserImportDialog: React.FC<UserImportDialogProps> = ({
  open,
  onClose,
  onImportComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UserImportResult | null>(null);
  const [previewData, setPreviewData] = useState<CsvPreviewRow[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setError(null);
    setResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    setShowHelp(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        setError("Please select a valid CSV file");
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
      previewCsvFile(file);
    }
  };

  const previewCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 1) {
        setError("CSV file is empty");
        setPreviewData([]);
        return;
      }

      const headerRow = lines[0]
        .split(",")
        .map((col) => normalizeHeader(col.replace(/"/g, "")));
      const missing = REQUIRED_HEADERS.filter(
        (required) => !headerRow.includes(required),
      );
      if (missing.length > 0) {
        setError(
          `Missing required columns: ${missing.join(", ")}. Expected: email,firstname,lastname,parent1 (role and parent2 optional)`,
        );
        setPreviewData([]);
        return;
      }

      const indices = {
        role: headerRow.indexOf("role"),
        email: headerRow.indexOf("email"),
        firstName: headerRow.indexOf("firstname"),
        lastName: headerRow.indexOf("lastname"),
        parent1: headerRow.indexOf("parent1"),
        parent2: headerRow.indexOf("parent2"),
      };

      const preview: CsvPreviewRow[] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const columns = lines[i]
          .split(",")
          .map((col) => col.trim().replace(/"/g, ""));
        preview.push({
          role: indices.role >= 0 ? columns[indices.role] || "" : "",
          email: columns[indices.email] || "",
          firstName: columns[indices.firstName] || "",
          lastName: columns[indices.lastName] || "",
          parent1: columns[indices.parent1] || "",
          parent2: indices.parent2 >= 0 ? columns[indices.parent2] || "" : "",
        });
      }
      setPreviewData(preview);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setResult(null);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const importResult = await importUsersCsv(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setResult(importResult);
      onImportComplete?.();
    } catch (uploadError) {
      const axiosError = uploadError as AxiosError;
      setError(
        "Error uploading file: " +
          (typeof axiosError.response?.data === "string"
            ? axiosError.response.data
            : (axiosError.response?.data?.toString() ??
              axiosError.response?.statusText ??
              "Unknown server error")),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      resetState();
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          Import Users from CSV
          <IconButton
            aria-label="How CSV import works"
            onClick={() => setShowHelp(true)}
            size="small"
          >
            <HelpOutline />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Alert severity="info">
              <Typography variant="body2">
                Select a CSV file to import parents, students, staff, and
                teachers for the current school year. Use the help button for
                column requirements and matching rules.
              </Typography>
            </Alert>

            <Box>
              <input
                accept=".csv"
                style={{ display: "none" }}
                id="csv-file-input"
                type="file"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <label htmlFor="csv-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={isUploading}
                  sx={{ mb: 2 }}
                >
                  Select CSV File
                </Button>
              </label>

              {selectedFile && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Description color="primary" />
                  <Typography variant="body2">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{" "}
                    KB)
                  </Typography>
                </Box>
              )}
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            {result && (
              <Alert
                severity={result.rowErrors.length > 0 ? "warning" : "success"}
              >
                <Typography variant="body2">
                  Created {result.createdUsersCount} users, updated{" "}
                  {result.updatedUsersCount} users. Created{" "}
                  {result.createdStudentsCount} students, updated{" "}
                  {result.updatedStudentsCount} students. Linked{" "}
                  {result.enrollmentLinksCount} enrollments.
                </Typography>
                {result.rowErrors.length > 0 && (
                  <Box sx={{ mt: 1, maxHeight: 160, overflow: "auto" }}>
                    {result.rowErrors.map((rowError) => (
                      <Typography
                        key={`${rowError.row}-${rowError.message}`}
                        variant="body2"
                      >
                        Row {rowError.row}: {rowError.message}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Alert>
            )}

            {isUploading && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Uploading and processing file...
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            {previewData.length > 0 && !isUploading && !result && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Preview (first 5 rows):
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Role</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>First Name</TableCell>
                        <TableCell>Last Name</TableCell>
                        <TableCell>Parent1</TableCell>
                        <TableCell>Parent2</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.role}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.firstName}</TableCell>
                          <TableCell>{row.lastName}</TableCell>
                          <TableCell>{row.parent1}</TableCell>
                          <TableCell>{row.parent2}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isUploading}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Importing..." : "Upload and Import"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <UserImportHelpDialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </>
  );
};

export default UserImportDialog;
