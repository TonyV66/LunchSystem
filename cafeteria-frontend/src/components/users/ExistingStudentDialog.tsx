import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { Relations } from "../../api/CafeteriaClient";
import User from "../../models/User";

interface ExistingStudentDialogProps {
  relations: Relations;
  onClose: () => void;
  onSelectParent: (parent: User | null) => void;
}

const ExistingStudentDialog: React.FC<ExistingStudentDialogProps> = ({
  relations,
  onClose,
  onSelectParent,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>("");

  const handleConfirm = () => {
    if (selectedOption === "new") {
      onSelectParent(null); // null means create new student
    } else {
      const selectedParent = relations.parents.find(
        (p) => p.id.toString() === selectedOption
      );
      onSelectParent(selectedParent || null);
    }
    onClose();
  };

  const studentName =
    relations.students[0].firstName + " " + relations.students[0].lastName;
  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Student Already Exists</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          The following parents/guardians have a student named{" "}
          <strong>{studentName}</strong> in the specified grade. Select the
          parent/guardian of the student for which you would like to order, or add a new student.
        </Typography>

        <RadioGroup
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
        >
          {relations.parents.map((parent) => (
            <FormControlLabel
              key={parent.id}
              value={parent.id.toString()}
              control={<Radio />}
              label={`${parent.firstName} ${parent.lastName}`}
            />
          ))}
          <FormControlLabel
            value="new"
            control={<Radio />}
            label="Add a new student"
          />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedOption}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExistingStudentDialog; 