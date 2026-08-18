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
import {
  importStudentsCsv,
  StudentImportResult,
} from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface StudentImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface CsvPreviewRow {
  firstName: string;
  lastName: string;
  email: string;
  altEmail: string;
}

const REQUIRED_HEADERS = ["firstname", "lastname", "email"];

const normalizeHeader = (header: string): string =>
  header.trim().toLowerCase().replace(/[\s_]+/g, "");

const StudentImportHelpDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>How Student CSV Import Works</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            File format
          </Typography>
          <Typography variant="body2">
            Upload a CSV with a header row. Column order does not matter;
            columns are matched by name (case-insensitive). Each row is one
            student.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontFamily: "monospace" }}>
            firstName,lastName,email
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Optional column:{" "}
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              altEmail
            </Box>{" "}
            (second parent email)
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Required fields
          </Typography>
          <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                firstName
              </Box>{" "}
              and{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                lastName
              </Box>{" "}
              (student name)
            </li>
            <li>
              At least one of{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                email
              </Box>{" "}
              or{" "}
              <Box component="span" sx={{ fontFamily: "monospace" }}>
                altEmail
              </Box>{" "}
              (parent emails)
            </li>
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Example CSV
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              borderRadius: 1,
              bgcolor: "grey.100",
              fontFamily: "monospace",
              fontSize: "0.8125rem",
              overflowX: "auto",
              whiteSpace: "pre",
            }}
          >
            {`firstName,lastName,email,altEmail
Emma,Smith,parent1@example.com,parent2@example.com
Liam,Jones,parent3@example.com,
Olivia,Brown,parent4@example.com,parent5@example.com`}
          </Box>
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

const StudentImportDialog: React.FC<StudentImportDialogProps> = ({
  open,
  onClose,
  onImportComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StudentImportResult | null>(null);
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
          `Missing required columns: ${missing.join(", ")}. Expected: firstName,lastName,email (altEmail optional)`,
        );
        setPreviewData([]);
        return;
      }

      const indices = {
        firstName: headerRow.indexOf("firstname"),
        lastName: headerRow.indexOf("lastname"),
        email: headerRow.indexOf("email"),
        altEmail: headerRow.indexOf("altemail"),
      };

      const preview: CsvPreviewRow[] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const columns = lines[i]
          .split(",")
          .map((col) => col.trim().replace(/"/g, ""));
        preview.push({
          firstName: columns[indices.firstName] || "",
          lastName: columns[indices.lastName] || "",
          email: columns[indices.email] || "",
          altEmail:
            indices.altEmail >= 0 ? columns[indices.altEmail] || "" : "",
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

      const importResult = await importStudentsCsv(selectedFile);

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
          Import Students from CSV
          <IconButton
            aria-label="How student CSV import works"
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
                Select a CSV file to import students and their parents for the
                current school year. Use the help button for column
                requirements and an example file.
              </Typography>
            </Alert>

            <Box>
              <input
                accept=".csv"
                style={{ display: "none" }}
                id="student-csv-file-input"
                type="file"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <label htmlFor="student-csv-file-input">
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
                  Created {result.createdUsersCount} parents, created{" "}
                  {result.createdStudentsCount} students, matched{" "}
                  {result.matchedStudentsCount} students, linked{" "}
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
                        <TableCell>First Name</TableCell>
                        <TableCell>Last Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Alt Email</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.firstName}</TableCell>
                          <TableCell>{row.lastName}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.altEmail}</TableCell>
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

      <StudentImportHelpDialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </>
  );
};

export default StudentImportDialog;
