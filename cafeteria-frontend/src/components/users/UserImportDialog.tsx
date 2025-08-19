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
} from "@mui/material";
import { CloudUpload, Description } from "@mui/icons-material";
import { uploadUserCsv } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface UserImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: (importedCount: number) => void;
}

interface CsvRow {
  studentId: string;
  lastName: string;
  firstName: string;
  dob: string;
  grade: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

const UserImportDialog: React.FC<UserImportDialogProps> = ({
  open,
  onClose,
  onImportComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<CsvRow[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        setError("Please select a valid CSV file");
        return;
      }
      setSelectedFile(file);
      setError(null);
      setSuccess(null);
      previewCsvFile(file);
    }
  };

  const previewCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const preview: CsvRow[] = [];
      
      if (lines.length < 2) return; // Need at least header and one data row
      
      // Parse header row to find column indices
      const headerRow = lines[0].split(",").map(col => col.trim().replace(/"/g, ""));
      const columnIndices = {
        studentId: headerRow.findIndex(col => col.toLowerCase() === "student_id"),
        lastName: headerRow.findIndex(col => col.toLowerCase() === "last_name"),
        firstName: headerRow.findIndex(col => col.toLowerCase() === "first_name"),
        dob: headerRow.findIndex(col => col.toLowerCase() === "dob"),
        grade: headerRow.findIndex(col => col.toLowerCase() === "grade"),
        contactName: headerRow.findIndex(col => col.toLowerCase() === "contact_name"),
        contactPhone: headerRow.findIndex(col => col.toLowerCase() === "contact_phone"),
        contactEmail: headerRow.findIndex(col => col.toLowerCase() === "contact_email"),
      };
      
      // Check if all required columns are found
      const requiredColumns = ["studentId", "contactName", "contactEmail"];
      const missingColumns = requiredColumns
        .filter(colName => columnIndices[colName as keyof typeof columnIndices] === -1)
        .map(colName => {
          switch(colName) {
            case "studentId": return "student_id";
            case "contactName": return "contact_name";
            case "contactEmail": return "contact_email";
            default: return colName;
          }
        });
      
      if (missingColumns.length > 0) {
        setError(`Missing required columns: ${missingColumns.join(", ")}`);
        return;
      }
      
      // Process first 5 data rows for preview
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const line = lines[i].trim();
        if (line) {
          const columns = line.split(",").map(col => col.trim().replace(/"/g, ""));
          if (columns.length >= Math.max(...Object.values(columnIndices)) + 1) {
            preview.push({
              studentId: columns[columnIndices.studentId] || "",
              lastName: columns[columnIndices.lastName] || "",
              firstName: columns[columnIndices.firstName] || "",
              dob: columns[columnIndices.dob] || "",
              grade: columns[columnIndices.grade] || "",
              contactName: columns[columnIndices.contactName] || "",
              contactPhone: columns[columnIndices.contactPhone] || "",
              contactEmail: columns[columnIndices.contactEmail] || "",
            });
          }
        }
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
    setSuccess(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadUserCsv(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setSuccess(`Successfully imported ${result.importedUsersCount} users and ${result.importedStudentsCount} students. ${result.skippedUsersCount} users and ${result.skippedStudentsCount} students were skipped (already existed).`);
      
      if (onImportComplete) {
        onImportComplete(result.importedUsersCount + result.importedStudentsCount);
      }
      
      // Reset form after a delay
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewData([]);
        setUploadProgress(0);
        setIsUploading(false);
      }, 2000);
      
    } catch (error) {
      const axiosError = error as AxiosError;
      setError(
        "Error uploading file: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setPreviewData([]);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Users from CSV</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Alert severity="info">
            <Typography variant="body2">
              Upload a CSV file with the following required columns:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
              <li>student_id</li>
              <li>contact_name (full name of the parent/contact)</li>
              <li>contact_email</li>
              <li>contact_phone (optional)</li>
              <li>first_name (for student)</li>
              <li>last_name (for student)</li>
              <li>dob (for student)</li>
              <li>grade (for student)</li>
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
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </Typography>
              </Box>
            )}
          </Box>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success">
              {success}
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

          {previewData.length > 0 && !isUploading && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Preview (first 5 rows):
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>
                        Student ID
                      </th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>
                        Last Name
                      </th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>
                        First Name
                      </th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>
                        DOB
                      </th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>
                        Grade
                      </th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>
                        Contact Name
                      </th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>
                        Contact Phone
                      </th>
                      <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>
                        Contact Email
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                          {row.studentId}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                          {row.lastName}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                          {row.firstName}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                          {row.dob}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                          {row.grade}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                          {row.contactName}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                          {row.contactPhone}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                          {row.contactEmail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? "Uploading..." : "Upload and Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserImportDialog; 