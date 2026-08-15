import React, { useContext, useState } from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { IconButton, ListItem, Typography } from "@mui/material";
import { Delete, Edit, RestoreFromTrash } from "@mui/icons-material";
import Menu from "../../models/Menu";
import DailyMenu from "../../models/DailyMenu";
import PantryItem from "../../models/PantryItem";
import { PantryItemType } from "../../models/PantryItemType";
import { AppContext } from "../../AppContextProvider";
import {
  archivePantryItem,
  unarchivePantryItem,
} from "../../api/CafeteriaClient";
import { AxiosError } from "axios";
import ConfirmDialog from "../ConfirmDialog";
import PantryItemDialog from "./PantryItemDialog";

interface Props {
  menu?: Menu | DailyMenu;
  nameFilter?: string;
  typeOfItem: PantryItemType;
  archived?: boolean;
  onItemClicked: (item: PantryItem) => void;
}

const MenuItemsList: React.FC<Props> = (props) => {
  const { typeOfItem, menu, nameFilter, onItemClicked, archived = false } =
    props;
  const { pantryItems: allPantryItems, setPantryItems, setSnackbarErrorMsg } =
    useContext(AppContext);
  const [itemToArchive, setItemToArchive] = useState<PantryItem>();
  const [itemToEdit, setItemToEdit] = useState<PantryItem>();

  const sortedItems = allPantryItems
    .filter(
      (item) =>
        item.archived === archived &&
        (!menu || !menu.items.some((menuItem) => menuItem.pantryItemId === item.id)) &&
        item.type === typeOfItem &&
        (!nameFilter?.length ||
          item.name.toLowerCase().indexOf(nameFilter.toLowerCase()) >= 0)
    )
    .sort((item1, item2) =>
      item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
    );

  const handleArchivePantryItem = async () => {
    if (!itemToArchive) {
      return;
    }
    const id = itemToArchive.id;
    setItemToArchive(undefined);
    try {
      const archivedItem = await archivePantryItem(id);
      setPantryItems(
        allPantryItems.map((item) => (item.id === id ? archivedItem : item))
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error archiving menu item: " +
        (axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error")
      );
    }
  };

  const handleUnarchivePantryItem = async (id: number) => {
    try {
      const restoredItem = await unarchivePantryItem(id);
      setPantryItems(
        allPantryItems.map((item) => (item.id === id ? restoredItem : item))
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error restoring menu item: " +
        (axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error")
      );
    }
  };

  const handlePantryItemSaved = (savedItem: PantryItem) => {
    setPantryItems(
      allPantryItems.map((item) =>
        item.id === savedItem.id ? savedItem : item
      )
    );
    setItemToEdit(undefined);
  };

  return (
    <Box>
      <List component="nav" dense={true} aria-label="secondary mailbox folder">
        {sortedItems.map((item) => (
          <ListItem
            key={item.id}
            secondaryAction={
              archived ? (
                <IconButton
                  edge="end"
                  color="primary"
                  onClick={() => handleUnarchivePantryItem(item.id)}
                  aria-label="restore"
                >
                  <RestoreFromTrash />
                </IconButton>
              ) : (
                <Box>
                  <IconButton
                    edge="end"
                    color="primary"
                    onClick={() => setItemToEdit(item)}
                    aria-label="edit"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="primary"
                    onClick={() => setItemToArchive(item)}
                    aria-label="archive"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              )
            }
            disablePadding
          >
            <ListItemButton onClick={() => onItemClicked(item)}>
              <ListItemText
                primaryTypographyProps={{
                  style: {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
                primary={item.name}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {itemToArchive && (
        <ConfirmDialog
          open={true}
          title="Archive Menu Item"
          onOk={handleArchivePantryItem}
          onCancel={() => setItemToArchive(undefined)}
        >
          <Typography>
            {`"${itemToArchive.name}" will be archived and no longer available when creating new menus. Existing menus will not be affected. Do you wish to continue?`}
          </Typography>
        </ConfirmDialog>
      )}
      {itemToEdit && (
        <PantryItemDialog
          open={true}
          type={itemToEdit.type}
          pantryItem={itemToEdit}
          onCancel={() => setItemToEdit(undefined)}
          onSaved={handlePantryItemSaved}
        />
      )}
    </Box>
  );
};

export default MenuItemsList;
