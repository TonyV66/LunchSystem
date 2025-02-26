import React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { IconButton, ListItem } from "@mui/material";
import { Delete } from "@mui/icons-material";
import Menu, { PantryItem, PantryItemType } from "../../models/Menu";
import { useContext } from "react";
import { AppContext } from "../../AppContextProvider";
import { deletePantryItem } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

interface Props {
  menu?: Menu;
  nameFilter?: string;
  typeOfItem: PantryItemType;
  onItemClicked: (item: PantryItem) => void;
}

const MenuItemsList: React.FC<Props> = (props) => {
  const { typeOfItem, menu, nameFilter, onItemClicked } = props;
  const { pantryItems: allPantryItems, setPantryItems, setSnackbarErrorMsg } =
    useContext(AppContext);

  const unsortedItems = menu ? menu.items : allPantryItems;

  const sortedItems = [...unsortedItems]
    .filter(
      (item) =>
        item.type === typeOfItem &&
        (!nameFilter?.length ||
          item.name.toLowerCase().indexOf(nameFilter.toLowerCase()) >= 0)
    )
    .sort((item1, item2) =>
      item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
    );

  const handleDeletePantryItem = async (id: number) => {
    try {
      await deletePantryItem(id);
      setPantryItems(allPantryItems.filter((item) => item.id !== id));
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error deleting menu item: " +
        (axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error")
      );
    }
  };

  return (
    <Box>
      <List component="nav" dense={true} aria-label="secondary mailbox folder">
        {sortedItems.map((item) => (
          <ListItem
            key={item.id}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => handleDeletePantryItem(item.id)}
                aria-label="comments"
              >
                <Delete />
              </IconButton>
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
    </Box>
  );
};

export default MenuItemsList;
