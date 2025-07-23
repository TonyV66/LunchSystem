import React, { useEffect } from "react";
import { FormControlLabel, Paper, Typography, Radio } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import { GradeLevel, getGradeName } from "../../models/GradeLevel";

interface GradesListProps {
  availGrades: GradeLevel[];
  selectedGrades: GradeLevel[];
  onSelectedGradesChanged: (selectedGrades: GradeLevel[]) => void;
  isSingleSelect?: boolean;
}

const GradesList: React.FC<GradesListProps> = ({
  availGrades,
  selectedGrades,
  onSelectedGradesChanged,
  isSingleSelect = false,
}) => {
  const [checked, setChecked] = React.useState<GradeLevel[]>(selectedGrades);

  useEffect(() => {
    setChecked(selectedGrades);
  }, [selectedGrades]);

  const handleToggleCheckbox = (
    event: React.ChangeEvent<HTMLInputElement>,
    grade: GradeLevel
  ) => {
    const updatedGrades = event.target.checked
      ? [...checked, grade]
      : checked.filter((g) => g !== grade);
    setChecked(updatedGrades);
    onSelectedGradesChanged(updatedGrades);
  };

  const handleToggleRadio = (grade: GradeLevel) => {
    const updatedGrades = checked.includes(grade) ? [] : [grade];
    setChecked(updatedGrades);
    onSelectedGradesChanged(updatedGrades);
  };

  return (
    <Paper
      sx={{
        minWidth: "120px",
        pt: 1,
        pb: 1,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {availGrades.length === 0 ? (
        <Typography sx={{ px: 2, py: 1 }} variant="body2" color="text.secondary">
          None
        </Typography>
      ) : (
        availGrades
          .sort((a, b) => {
            // Sort by grade level numerically, with Pre-K and K at the beginning
            if (a === GradeLevel.PRE_K) return -1;
            if (b === GradeLevel.PRE_K) return 1;
            if (a === GradeLevel.KINDERGARTEN) return -1;
            if (b === GradeLevel.KINDERGARTEN) return 1;
            if (a === GradeLevel.UNKNOWN) return 1;
            if (b === GradeLevel.UNKNOWN) return -1;
            return parseInt(a) - parseInt(b);
          })
          .map((grade) => {
            return (
              <FormControlLabel
                sx={{ marginRight: "0px", marginLeft: "0px" }}
                key={grade}
                control={
                  isSingleSelect ? (
                    <Radio
                      sx={{ paddingTop: "5px", paddingBottom: "5px" }}
                      size="small"
                      onClick={() => handleToggleRadio(grade)}
                      checked={checked.includes(grade)}
                    />
                  ) : (
                    <Checkbox
                      sx={{ paddingTop: "5px", paddingBottom: "5px" }}
                      size="small"
                      onChange={(event) => handleToggleCheckbox(event, grade)}
                      checked={checked.includes(grade)}
                    />
                  )
                }
                label={
                  <Typography sx={{ textWrap: "nowrap" }} variant="body2">
                    {getGradeName(grade)}
                  </Typography>
                }
              />
            );
          })
      )}
    </Paper>
  );
};

export default GradesList; 