import React, { useContext, useMemo } from 'react';
import { Autocomplete, TextField, Box, Typography, Stack } from '@mui/material';
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
  const { students, orders, users, user } = useContext(AppContext);

  // Sort students by name
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => (a.firstName + " " + a.lastName).localeCompare(b.firstName + " " + b.lastName));
  }, [students]);

  // Get parent name to display for student
  const getParentName = (student: Student): string => {
    if (!student.parents || student.parents.length === 0) {
      return "Unknown";
    }

    // Check if current user is a parent of this student
    const isCurrentUserParent = student.parents.includes(user.id);
    if (isCurrentUserParent) {
      return `${user.firstName} ${user.lastName}`;
    }

    // If multiple parents, find the one who has ordered the most meals
    if (student.parents.length > 1) {
      const parentOrderCounts = new Map<number, number>();
      
      // Count orders for each parent
      orders.forEach(order => {
        const studentMeals = order.meals.filter(meal => meal.studentId === student.id);
        if (studentMeals.length > 0) {
          const parentId = order.userId;
          parentOrderCounts.set(parentId, (parentOrderCounts.get(parentId) || 0) + 1);
        }
      });

      // Find parent with most orders
      let maxOrders = 0;
      let parentWithMostOrders: number | null = null;
      
      parentOrderCounts.forEach((orderCount, parentId) => {
        if (orderCount > maxOrders) {
          maxOrders = orderCount;
          parentWithMostOrders = parentId;
        }
      });

      if (parentWithMostOrders) {
        const parent = users.find(u => u.id === parentWithMostOrders);
        if (parent) {
          return `${parent.firstName} ${parent.lastName}`;
        }
      }
    }

    // Fallback to first parent
    const firstParent = users.find(u => u.id === student.parents[0]);
    return firstParent ? `${firstParent.firstName} ${firstParent.lastName}` : "";
  };

  // Custom filter function for student names
  const filterOptions = (options: Student[], { inputValue }: { inputValue: string }) => {
    const searchTerm = inputValue.toLowerCase().trim();
    const ops = options.filter(option => 
      (option.firstName + " " + option.lastName).toLowerCase().includes(searchTerm)
    );
    return ops;
  };

  return (
    <Autocomplete
      value={value}
      disablePortal
      onChange={(_, newValue) => onChange(newValue)}
      options={sortedStudents}
      ListboxProps={{ style: { maxHeight: 200 } }}
      renderOption={(props, item) => (
        <li {...props} key={item.id}>
          <Box>
            <Typography variant="body2">
              {item.firstName + " " + item.lastName}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">
                Parent/Guardian:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getParentName(item)}
              </Typography>
            </Stack>
          </Box>
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