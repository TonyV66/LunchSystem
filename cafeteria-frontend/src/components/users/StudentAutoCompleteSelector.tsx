import React, { useContext, useMemo } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { AppContext } from '../../AppContextProvider';
import Student from '../../models/Student';

interface StudentAutoCompleteSelectorProps {
  value: Student | null;
  onChange: (student: Student | null) => void;
  label?: string;
  disabled?: boolean;
}

const StudentAutoCompleteSelector: React.FC<StudentAutoCompleteSelectorProps> = ({
  value,
  onChange,
  label = 'Select Student',
  disabled = false,
}) => {
  const { students } = useContext(AppContext);

  // Sort students by name
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => (a.firstName + " " + a.lastName).localeCompare(b.firstName + " " + b.lastName));
  }, [students]);

  // Custom filter function for student names
  const filterOptions = (options: Student[], { inputValue }: { inputValue: string }) => {
    const searchTerm = inputValue.toLowerCase().trim();
    const ops = options.filter(option => 
      (option.firstName + " " + option.lastName).toLowerCase().includes(searchTerm)
    );
    if (searchTerm.length >= 2) {
      console.log("Here I am");
    }
    return ops;
  };

  return (
    <Autocomplete
      value={value}
      disablePortal
      onChange={(_, newValue) => onChange(newValue)}
      options={sortedStudents}
      renderOption={(props, item) => (
        <li {...props} key={item.id}>
          {item.firstName + " " + item.lastName}
        </li>)}
      getOptionLabel={(option) => option.firstName + " " + option.lastName}
      filterOptions={filterOptions}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          fullWidth
        />
      )}
      disabled={disabled}
    />
  );
};

export default StudentAutoCompleteSelector; 