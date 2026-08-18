import React from "react";
import {
  Box,
  IconButton,
  Paper,
  Typography,
  FormControl,
  Input,
  InputAdornment,
  Fab,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { useContext, useEffect, useState } from "react";
import {
  Add,
  Close,
  Search,
} from "@mui/icons-material";
import Menu from "../../models/Menu";
import MenuDialog from "../menus/MenuDialog";
import ConfirmDialog from "../ConfirmDialog";
import { deleteMenu } from "../../api/CafeteriaClient";
import MealCalendar from "./MealCalendar";
import AvailableMenusPanel from "./AvailableMenusPanel";
import { AxiosError } from "axios";
import { grey } from "@mui/material/colors";



const enum EditType {
  UPDATE_MENU,
  CREATE_MENU,
}
const PlannerPage: React.FC = () => {
  const { menus, setMenus, setSnackbarErrorMsg, currentSchoolYear, pantryItems } =
    useContext(AppContext);
  const [copiedMenu, setCopiedMenu] = useState<Menu | undefined>();
  const [editMenu, setEditMenu] = useState<Menu | undefined>();
  const [menuToDelete, setMenuToDelete] = useState<Menu | undefined>();
  const [typeOfEdit, setTypeOfEdit] = useState<EditType>();
  const [search, setSearch] = useState("");
  const [filteredMenus, setFilteredMenus] = useState<Menu[]>([]);

  const handleCopyMenu = (menu: Menu) => {
    setCopiedMenu(menu);
  };

  const handleRequestDeleteMenu = (menu: Menu) => {
    setMenuToDelete(menu);
  };

  const handleCancelDeleteMenu = () => {
    setMenuToDelete(undefined);
  };

  const handleConfirmDeleteMenu = async () => {
    if (!menuToDelete) {
      return;
    }
    const menu = menuToDelete;
    setMenuToDelete(undefined);
    try {
      await deleteMenu(menu.id);
      if (menu === copiedMenu) {
        setCopiedMenu(undefined);
      }
      setMenus(menus.filter((m) => m !== menu));
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error deleting menu: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
  };

  const handleEditMenu = (menu: Menu) => {
    if (menu === copiedMenu) {
      setCopiedMenu(undefined);
    }
    setEditMenu(menu);
    setTypeOfEdit(EditType.UPDATE_MENU);
  };

  const handleCancelEditMenu = () => {
    setEditMenu(undefined);
    setTypeOfEdit(undefined);
  };

  const handleMenuSaved = (savedMenu: Menu) => {
    if (typeOfEdit === EditType.CREATE_MENU) {
      setMenus(menus.concat(savedMenu));
    } else {
      setMenus(menus.map((menu) => (menu !== editMenu ? menu : savedMenu)));
    }

    setEditMenu(undefined);
    setTypeOfEdit(undefined);
  };

  const handleMouseDownSearch = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleMouseUpSearch = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  useEffect(() => {
    if (search.length) {
      const filtereMenus = menus.filter((menu) =>
        menu.items.find(
          (item) => pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)!.name.toLowerCase().indexOf(search.toLowerCase()) >= 0
        )
      );
      setFilteredMenus(filtereMenus);
      if (copiedMenu && !filtereMenus.includes(copiedMenu)) {
        setCopiedMenu(undefined);
      }
    } else {
      setFilteredMenus(menus);
    }
  }, [menus, search, copiedMenu]);

  return (
    <Box
      className="plannerPage"
      sx={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr auto auto",
      }}
    >
      {currentSchoolYear.id ? (
        <Box p={1} sx={{ overflowY: "auto" }}>
          <MealCalendar clipboardMenu={copiedMenu} />
        </Box>
      ) : (
        <Box
          p={1}
          sx={{
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              There is no active school year. Please set up a school year to
              plan meals.
            </Typography>
          </Paper>
        </Box>
      )}
      <Box
        sx={{
          borderTopWidth: 1,
          borderTopColor: "black",
          borderTopStyle: "solid",
          backgroundColor: grey[100],
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          pl: 2,
          pr: 2,
          pb: 1,
          pt: 1,
        }}
      >
        <Typography fontWeight="bold" sx={{ flexGrow: 1 }}>
          Menus
        </Typography>
        <FormControl variant="standard">
          <Input
            id="standard-adornment-password"
            type={"text"}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  disabled={!search.length}
                  onClick={() => setSearch("")}
                  onMouseDown={handleMouseDownSearch}
                  onMouseUp={handleMouseUpSearch}
                >
                  {search.length ? <Close /> : <Search />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
        <Fab
          size="small"
          onClick={() => setTypeOfEdit(EditType.CREATE_MENU)}
          color="primary"
        >
          <Add />
        </Fab>
      </Box>
      <AvailableMenusPanel
        filteredMenus={filteredMenus}
        copiedMenu={copiedMenu}
        onCopyMenu={handleCopyMenu}
        onEditMenu={handleEditMenu}
        onDeleteMenu={handleRequestDeleteMenu}
      />
      {(typeOfEdit === EditType.CREATE_MENU ||
        typeOfEdit === EditType.UPDATE_MENU) && (
        <MenuDialog
          menu={editMenu}
          onCancel={handleCancelEditMenu}
          onOk={(savedMenu) => handleMenuSaved(savedMenu as Menu)}
        />
      )}
      {menuToDelete ? (
        <ConfirmDialog
          title="Delete Menu"
          open={true}
          okLabel="Delete"
          onOk={handleConfirmDeleteMenu}
          onCancel={handleCancelDeleteMenu}
        >
          <Typography>
            Are you sure you want to delete this menu?
          </Typography>
        </ConfirmDialog>
      ) : (
        <></>
      )}
    </Box>
  );
};

export default PlannerPage;
