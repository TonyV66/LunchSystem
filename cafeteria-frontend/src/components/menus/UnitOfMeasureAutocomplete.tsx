import React, { useContext, useEffect, useState } from "react";
import {
  Autocomplete,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { AxiosError } from "axios";
import { createUnitOfMeasure } from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import ConfirmDialog from "../ConfirmDialog";

interface UnitOfMeasureAutocompleteProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const UnitOfMeasureAutocomplete: React.FC<UnitOfMeasureAutocompleteProps> = ({
  value,
  disabled,
  onChange,
}) => {
  const { unitsOfMeasure, setUnitsOfMeasure, setSnackbarErrorMsg } =
    useContext(AppContext);
  const [inputValue, setInputValue] = useState(value);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const options = unitsOfMeasure
    .map((unit) => unit.name)
    .sort((a, b) => a.localeCompare(b));

  const trimmed = inputValue.trim();
  const hasExactMatch = options.some(
    (option) => option.toLowerCase() === trimmed.toLowerCase(),
  );
  const showAddButton =
    !disabled && trimmed.length > 0 && !hasExactMatch;

  const handleValueChanged = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (
    _: React.SyntheticEvent,
    newInputValue: string,
  ) => {
    const nextTrimmed = newInputValue.trim();
    const existing = options.find(
      (option) => option.toLowerCase() === nextTrimmed.toLowerCase(),
    );

    if (existing && newInputValue === nextTrimmed) {
      handleValueChanged(existing);
    } else {
      handleValueChanged(newInputValue);
    }
  };

  const handleConfirmAdd = async () => {
    if (!trimmed) {
      return;
    }

    try {
      setIsAdding(true);
      const created = await createUnitOfMeasure(trimmed);
      setUnitsOfMeasure([...unitsOfMeasure, created]);
      handleValueChanged(created.name);
      setShowConfirmDialog(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error creating unit of measure: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error"),
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <Autocomplete
        freeSolo
        autoHighlight
        disableClearable
        disabled={disabled}
        options={options}
        value={inputValue}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={(_, newValue) => {
          handleValueChanged(
            typeof newValue === "string" ? newValue : (newValue ?? ""),
          );
        }}
        filterOptions={(opts, state) => {
          const query = state.inputValue.trim().toLowerCase();
          if (query === "") {
            return opts;
          }
          return opts.filter((option) =>
            option.toLowerCase().includes(query),
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps?.endAdornment}
                    {showAddButton ? (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setShowConfirmDialog(true)}
                        sx={{ flexShrink: 0, padding: 0 }}
                      >
                        <Add />
                      </IconButton>
                    ) : null}
                  </>
                ),
              },
            }}
          />
        )}
      />
      {showConfirmDialog && (
        <ConfirmDialog
          open={true}
          title="Add Unit Of Measure"
          onOk={handleConfirmAdd}
          onCancel={() => setShowConfirmDialog(false)}
          isOkDisabled={isAdding}
          okLabel="Add"
        >
          <Typography>
            {`"${trimmed}" will be added as a new unit of measure. Do you wish to continue?`}
          </Typography>
        </ConfirmDialog>
      )}
    </>
  );
};

export default UnitOfMeasureAutocomplete;
