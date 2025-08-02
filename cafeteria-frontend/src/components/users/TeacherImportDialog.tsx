import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { importTeachers } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";

interface TeacherImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CsvRow {
  lastName: string;
  firstName: string;
  email: string;
}

const TeacherImportDialog: React.FC<TeacherImportDialogProps> = ({
  open,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CsvRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<number>();
  const [error, setError] = useState<string | null>(null);

  const { users, setUsers } = useContext(AppContext);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadResult(undefined);
      previewCsvFile(selectedFile);
    }
  };

  const previewCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      
      // Find column indices (case insensitive)
      const lastNameIndex = headers.findIndex(h => 
        h.toLowerCase() === "lastname" || 
        h.toLowerCase() === "last_name"
      );
      const firstNameIndex = headers.findIndex(h => 
        h.toLowerCase() === "firstname" || 
        h.toLowerCase() === "first_name"
      );
      const emailIndex = headers.findIndex(h => 
        h.toLowerCase() === "email"
      );

      // Validate required columns
      if (lastNameIndex === -1 || firstNameIndex === -1 || emailIndex === -1) {
        setError("CSV file must contain columns: last_name, first_name, email");
        setPreviewData([]);
        return;
      }

      const previewRows: CsvRow[] = [];
      for (let i = 1; i < Math.min(6, lines.length); i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
          previewRows.push({
            lastName: values[lastNameIndex] || "",
            firstName: values[firstNameIndex] || "",
            email: values[emailIndex] || "",
          });
        }
      }
      setPreviewData(previewRows);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const importedTeachers = await importTeachers(formData);
      const newTeachers = importedTeachers.filter(teacher => !users.some(u => u.id === teacher.id));
      const updatedTeachers = importedTeachers.filter(teacher => users.some(u => u.id === teacher.id));
      setUsers(users.map(u => updatedTeachers.find(t => t.id === u.id) || u).concat(newTeachers));
      setUploadResult(importedTeachers.length);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error importing teachers";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setUploadResult(undefined);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Teacherss</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV file with teacher information. The file should contain columns: last_name, first_name, email
          </Typography>
          
          <input
            accept=".csv"
            style={{ display: "none" }}
            id="teacher-import-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="teacher-import-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
            >
              Choose CSV File
            </Button>
          </label>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {previewData.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Preview (first 5 rows):
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Last Name</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.lastName}</TableCell>
                      <TableCell>{row.firstName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {uploadResult !== undefined && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Import completed successfully!<br />
            Imported: {uploadResult} teachers<br />
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          variant="contained"
        >
          {isUploading ? <CircularProgress size={20} /> : "Import Teachers"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeacherImportDialog; 