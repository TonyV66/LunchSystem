import React, {
  ChangeEvent,
  KeyboardEvent,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AxiosError } from "axios";
import {
  createIngredient,
  createPantryItem,
  createUnitOfMeasure,
  updatePantryItem,
} from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import PantryItem from "../../models/PantryItem";
import { PantryItemType } from "../../models/PantryItemType";
import RecipeItem from "../../models/RecipeItem";
import RecipeTable, {
  createDraftRow,
  RecipeRow,
  rowsFromRecipeItems,
} from "./RecipeTable";

interface PantryItemDialogProps {
  open: boolean;
  type: PantryItemType;
  pantryItem?: PantryItem;
  onCancel: () => void;
  onSaved: (item: PantryItem) => void;
}

const PantryItemDialog: React.FC<PantryItemDialogProps> = ({
  open,
  type,
  pantryItem,
  onCancel,
  onSaved,
}) => {
  const {
    setSnackbarErrorMsg,
    ingredients,
    setIngredients,
    unitsOfMeasure,
    setUnitsOfMeasure,
  } = useContext(AppContext);
  const isEdit = !!pantryItem;
  const [name, setName] = useState("");
  const [servingSize, setServingSize] = useState("1");
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([createDraftRow()]);

  useEffect(() => {
    if (open) {
      setName(pantryItem?.name ?? "");
      setServingSize(String(pantryItem?.recipeServingSize ?? 1));
      setRecipeRows(
        pantryItem?.recipeItems?.length
          ? rowsFromRecipeItems(pantryItem.recipeItems)
          : [createDraftRow()],
      );
    }
  }, [open, pantryItem]);

  const servingSizeNumber = parseFloat(servingSize);
  const canSave =
    (isEdit || name.trim().length > 0) &&
    !isNaN(servingSizeNumber) &&
    servingSizeNumber > 0;

  const resetForm = () => {
    setName("");
    setServingSize("1");
    setRecipeRows([createDraftRow()]);
  };

  const handleClose = () => {
    resetForm();
    onCancel();
  };

  const ensureCatalogEntries = async (items: RecipeItem[]) => {
    let nextIngredients = [...ingredients];
    let nextUnits = [...unitsOfMeasure];

    for (const item of items) {
      const unitName = item.unitOfMeasure?.trim();
      if (
        unitName &&
        !nextUnits.some(
          (unit) => unit.name.toLowerCase() === unitName.toLowerCase(),
        )
      ) {
        const created = await createUnitOfMeasure(unitName);
        nextUnits = [...nextUnits, created];
      }

      const ingredientName = item.description.trim();
      if (
        ingredientName &&
        !nextIngredients.some(
          (ingredient) =>
            ingredient.name.toLowerCase() === ingredientName.toLowerCase(),
        )
      ) {
        const created = await createIngredient(ingredientName);
        nextIngredients = [...nextIngredients, created];
      }
    }

    if (nextUnits.length !== unitsOfMeasure.length) {
      setUnitsOfMeasure(nextUnits);
    }
    if (nextIngredients.length !== ingredients.length) {
      setIngredients(nextIngredients);
    }
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    const recipeItems: RecipeItem[] = recipeRows
      .filter((row) => row.description.trim().length > 0)
      .map((row) => ({
        id: 0,
        qty: parseFloat(row.qty) || 0,
        unitOfMeasure: row.unitOfMeasure.trim() || null,
        description: row.description.trim(),
      }));

    try {
      await ensureCatalogEntries(recipeItems);

      const savedItem = isEdit
        ? await updatePantryItem({
            ...pantryItem,
            recipeServingSize: servingSizeNumber,
            recipeItems,
          })
        : await createPantryItem({
            id: 0,
            name: name.trim(),
            type,
            recipeServingSize: servingSizeNumber,
            price: 0,
            archived: false,
            recipeItems,
          });
      resetForm();
      onSaved(savedItem);
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        `Error ${isEdit ? "updating" : "creating"} menu item: ` +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error"),
      );
    }
  };

  const handleKeyPressed = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && canSave) {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? "Edit Menu Item" : "Create Menu Item"}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus={!isEdit}
          margin="dense"
          label="Name"
          fullWidth
          variant="standard"
          value={name}
          disabled={isEdit}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setName(event.target.value)
          }
          onKeyUp={handleKeyPressed}
        />
        <Stack>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary"
            >
              Shopping List / Ingredients
            </Typography>
            <TextField
              autoFocus={isEdit}
              margin="dense"
              label="Serving Size"
              variant="standard"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={servingSize}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setServingSize(event.target.value)
              }
              onKeyUp={handleKeyPressed}
            />
          </Stack>
          <Paper>
            <RecipeTable rows={recipeRows} onChange={setRecipeRows} />
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!canSave} onClick={handleSave}>
          {isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PantryItemDialog;
