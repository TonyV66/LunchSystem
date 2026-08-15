import React, { ChangeEvent } from "react";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import RecipeItem from "../../models/RecipeItem";
import ProductAutocomplete from "./ProductAutocomplete";
import UnitOfMeasureAutocomplete from "./UnitOfMeasureAutocomplete";

export interface RecipeRow {
  key: number;
  qty: string;
  unitOfMeasure: string;
  description: string;
  isDraft: boolean;
}

let nextRecipeRowKey = -1;

export const createDraftRow = (): RecipeRow => ({
  key: nextRecipeRowKey--,
  qty: "0",
  unitOfMeasure: "",
  description: "",
  isDraft: true,
});

export const rowsFromRecipeItems = (recipeItems: RecipeItem[]): RecipeRow[] => [
  ...recipeItems.map((item) => ({
    key: item.id || nextRecipeRowKey--,
    qty: String(item.qty ?? 0),
    unitOfMeasure: item.unitOfMeasure ?? "",
    description: item.description ?? "",
    isDraft: false,
  })),
  createDraftRow(),
];

interface RecipeTableProps {
  rows: RecipeRow[];
  onChange: (rows: RecipeRow[]) => void;
}

const RecipeTable: React.FC<RecipeTableProps> = ({ rows, onChange }) => {
  const updateRow = (key: number, updates: Partial<RecipeRow>) => {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...updates } : row)));
  };

  const handleDeleteRow = (key: number) => {
    onChange(rows.filter((row) => row.key !== key));
  };

  const handleQuantityChanged = (key: number, value: string) => {
    const row = rows.find((r) => r.key === key);
    if (!row) {
      return;
    }

    const qtyNumber = parseFloat(value);
    const becameActiveDraft =
      row.isDraft && !isNaN(qtyNumber) && qtyNumber > 0;

    if (becameActiveDraft) {
      onChange([
        ...rows.map((r) =>
          r.key === key
            ? {
                ...r,
                qty: value,
                isDraft: false,
                unitOfMeasure: r.unitOfMeasure || "each",
              }
            : r
        ),
        createDraftRow(),
      ]);
      return;
    }

    onChange(rows.map((r) => (r.key === key ? { ...r, qty: value } : r)));
  };

  return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width="20%"><Typography variant="caption" fontWeight="bold" color="text.secondary">Quantity</Typography></TableCell>
            <TableCell width="30%"><Typography variant="caption" fontWeight="bold" color="text.secondary">Unit Of Measure</Typography></TableCell>
            <TableCell width="45%"><Typography variant="caption" fontWeight="bold" color="text.secondary">Product / Ingredient</Typography></TableCell>
            <TableCell width="5%" />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell>
                <TextField
                  variant="standard"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, step: "any" }}
                  value={row.qty}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleQuantityChanged(row.key, event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <UnitOfMeasureAutocomplete
                  disabled={row.isDraft}
                  value={row.unitOfMeasure}
                  onChange={(unitOfMeasure) =>
                    updateRow(row.key, { unitOfMeasure })
                  }
                />
              </TableCell>
              <TableCell>
                <ProductAutocomplete
                  disabled={row.isDraft}
                  value={row.description}
                  onChange={(description) =>
                    updateRow(row.key, { description })
                  }
                />
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={row.isDraft}
                  tabIndex={-1}
                  onClick={() => handleDeleteRow(row.key)}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
};

export default RecipeTable;
