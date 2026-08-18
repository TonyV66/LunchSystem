import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { grey } from "@mui/material/colors";
import { AxiosError } from "axios";
import { AppContext } from "../../AppContextProvider";
import SchoolUser from "../../models/SchoolUser";
import Student from "../../models/Student";
import { isFactsUserRole, Role } from "../../models/User";
import {
  getStudentEnrollmentHistory,
  StudentParentEnrollment,
  updateStudentEnrollments,
} from "../../api/CafeteriaClient";
import StaffAutoCompleteSelector from "./StaffAutoCompleteSelector";

interface ManageParentsDialogProps {
  student: Student;
  onClose: () => void;
}

const FACTS_USER_ROLES = [Role.PARENT, Role.TEACHER, Role.STAFF];

const applyParentEnrollmentUpdates = (
  currentStudents: Student[],
  studentId: number,
  parents: StudentParentEnrollment[],
): Student[] => {
  const enrolledParentIds = parents
    .filter((parent) => parent.enrolled)
    .map((parent) => parent.user.id);

  if (enrolledParentIds.length === 0) {
    return currentStudents.filter((student) => student.id !== studentId);
  }

  return currentStudents.map((student) =>
    student.id === studentId
      ? { ...student, parents: enrolledParentIds }
      : student,
  );
};

const ManageParentsDialog: React.FC<ManageParentsDialogProps> = ({
  student,
  onClose,
}) => {
  const {
    students,
    setStudents,
    currentSchoolYear,
    setSnackbarMsg,
    setSnackbarErrorMsg,
  } = useContext(AppContext);

  const [parents, setParents] = useState<StudentParentEnrollment[]>([]);
  const [originalEnrolled, setOriginalEnrolled] = useState<Map<number, boolean>>(
    new Map(),
  );
  const [selectedParent, setSelectedParent] = useState<SchoolUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const history = await getStudentEnrollmentHistory(student.id);
        if (cancelled) {
          return;
        }
        setParents(history);
        setOriginalEnrolled(
          new Map(history.map((parent) => [parent.user.id, parent.enrolled])),
        );
      } catch (error) {
        const axiosError = error as AxiosError;
        if (!cancelled) {
          setSnackbarErrorMsg(
            "Error loading enrollment history: " +
              (axiosError.response?.data?.toString() ??
                axiosError.response?.statusText ??
                "Unknown server error"),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [student.id, setSnackbarErrorMsg]);

  const hasChanges = useMemo(
    () =>
      parents.some(
        (parent) => originalEnrolled.get(parent.user.id) !== parent.enrolled,
      ),
    [parents, originalEnrolled],
  );

  const handleToggleEnrolled = (userId: number) => {
    setParents((current) =>
      current.map((parent) =>
        parent.user.id === userId
          ? { ...parent, enrolled: !parent.enrolled }
          : parent,
      ),
    );
  };

  const handleAddParent = () => {
    if (!selectedParent || !isFactsUserRole(selectedParent.role)) {
      return;
    }

    setParents((current) => {
      const existing = current.find(
        (parent) => parent.user.id === selectedParent.id,
      );
      if (existing) {
        if (existing.enrolled) {
          return current;
        }
        return current.map((parent) =>
          parent.user.id === selectedParent.id
            ? { ...parent, enrolled: true }
            : parent,
        );
      }

      return [...current, { user: selectedParent, enrolled: true }].sort(
        (a, b) =>
          `${a.user.firstName} ${a.user.lastName}`.localeCompare(
            `${b.user.firstName} ${b.user.lastName}`,
          ),
      );
    });
    setSelectedParent(null);
  };

  const handleSave = async () => {
    if (!currentSchoolYear.id) {
      setSnackbarErrorMsg("No school year selected.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateStudentEnrollments(
        student.id,
        parents.map((parent) => ({
          userId: parent.user.id,
          enrolled: parent.enrolled,
        })),
      );
      setStudents(
        applyParentEnrollmentUpdates(students, student.id, updated),
      );
      setSnackbarMsg("Enrollment updated");
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error updating enrollment: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Manage Parents of {student.firstName} {student.lastName}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} />
          </Box>
        ) : !currentSchoolYear.id ? (
          <Typography variant="body2" color="error">
            No school year selected.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {`Enrollment is for the current school year (${currentSchoolYear.name}).`}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    py: 0.25,
                  },
                  "& .MuiTableCell-head": {
                    backgroundColor: grey[200],
                    fontWeight: "bold",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell align="center">Can order meals</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" color="text.secondary">
                          No users who can order meals for this student at this
                          school.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    parents.map((parent) => (
                      <TableRow key={parent.user.id}>
                        <TableCell>
                          {`${parent.user.firstName} ${parent.user.lastName}`}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0 }}>
                          <Radio
                            size="small"
                            checked={parent.enrolled}
                            onClick={() => handleToggleEnrolled(parent.user.id)}
                            disabled={saving}
                            inputProps={{
                              "aria-label": `Enroll ${parent.user.firstName} ${parent.user.lastName}`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack
              direction="row"
              alignItems="flex-end"
              gap={1}
              sx={{ mt: 2 }}
            >
              <Box flex={1} minWidth={0}>
                <StaffAutoCompleteSelector
                  value={selectedParent}
                  onChange={setSelectedParent}
                  label="Add Parent"
                  disabled={saving}
                  roles={FACTS_USER_ROLES}
                  requireName
                  requireCurrentYearEnrollment
                />
              </Box>
              <IconButton
                color="primary"
                onClick={handleAddParent}
                disabled={saving || !selectedParent}
                aria-label="Add parent"
              >
                <Add />
              </IconButton>
            </Stack>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            loading || saving || !hasChanges || !currentSchoolYear.id
          }
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageParentsDialog;
