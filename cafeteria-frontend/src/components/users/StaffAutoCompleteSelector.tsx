import React, { useContext, useMemo } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import SchoolUser from "../../models/SchoolUser";
import { AccountStatus, Role } from "../../models/User";

const DEFAULT_STAFF_ROLES = [Role.TEACHER, Role.STAFF];

interface StaffAutoCompleteSelectorProps {
  value: SchoolUser | null;
  onChange: (staffMember: SchoolUser | null) => void;
  label?: string;
  disabled?: boolean;
  roles?: Role[];
  requireName?: boolean;
  requireCurrentYearEnrollment?: boolean;
}

const StaffAutoCompleteSelector: React.FC<StaffAutoCompleteSelectorProps> = ({
  value,
  onChange,
  label = "Select Teacher / Staff",
  disabled = false,
  roles = DEFAULT_STAFF_ROLES,
  requireName = false,
  requireCurrentYearEnrollment = false,
}) => {
  const { users, students } = useContext(AppContext);

  const userIdsWithEnrolledStudents = useMemo(() => {
    const ids = new Set<number>();
    for (const student of students) {
      student.parents?.forEach((parentId) => ids.add(parentId));
    }
    return ids;
  }, [students]);

  const sortedStaff = useMemo(() => {
    return users
      .filter((staffUser) => {
        if (!roles.includes(staffUser.role)) {
          return false;
        }
        if (staffUser.accountStatus === AccountStatus.INACTIVE) {
          return false;
        }
        if (
          requireName &&
          (!staffUser.firstName.trim() || !staffUser.lastName.trim())
        ) {
          return false;
        }
        if (
          requireCurrentYearEnrollment &&
          !userIdsWithEnrolledStudents.has(staffUser.id)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) =>
        (a.firstName + " " + a.lastName).localeCompare(
          b.firstName + " " + b.lastName,
        ),
      );
  }, [users, roles, requireName, requireCurrentYearEnrollment, userIdsWithEnrolledStudents]);

  const filterOptions = (
    options: SchoolUser[],
    { inputValue }: { inputValue: string },
  ) => {
    const searchTerm = inputValue.toLowerCase().trim();
    return options.filter((option) =>
      (option.firstName + " " + option.lastName)
        .toLowerCase()
        .includes(searchTerm),
    );
  };

  return (
    <Autocomplete
      value={value}
      disablePortal
      onChange={(_, newValue) => onChange(newValue)}
      options={sortedStaff}
      ListboxProps={{
        sx: {
          maxHeight: 200,
          py: 0,
          "& .MuiAutocomplete-option": {
            minHeight: "auto",
            py: 0.25,
          },
        },
      }}
      renderOption={(props, item) => (
        <li {...props} key={item.id}>
          {item.firstName + " " + item.lastName}
        </li>
      )}
      getOptionLabel={(option) => option.firstName + " " + option.lastName}
      filterOptions={filterOptions}
      isOptionEqualToValue={(option, optionValue) => option.id === optionValue.id}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="standard" fullWidth />
      )}
      disabled={disabled}
    />
  );
};

export default StaffAutoCompleteSelector;
