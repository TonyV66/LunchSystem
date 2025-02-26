import React from "react";
import {
  Box,
  IconButton,
  Menu as PulldownMenu,
  MenuItem,
  Paper,
  Typography,
  FormControl,
  Input,
  InputAdornment,
  Fab,
} from "@mui/material";
import { DateTimeUtils } from "../../DateTimeUtils";
import { AppContext } from "../../AppContextProvider";
import { useContext, useEffect, useState } from "react";
import MenuPanel from "../menus/MenuPanel";
import {
  Add,
  Close,
  CopyAll,
  Delete,
  Edit,
  MoreVert,
  Search,
} from "@mui/icons-material";
import Menu from "../../models/Menu";
import EditMenuDialog from "../menus/EditMenuDialog";
import { deleteMenu } from "../../api/CafeteriaClient";
import MealCalendar from "./MealCalendar";
import { AxiosError } from "axios";

interface TemplateMenuProps {
  menu: Menu;
  isCopySelected?: boolean;
  onCopy: (menu: Menu) => void;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
}

const TemplateMenu: React.FC<TemplateMenuProps> = ({
  menu,
  onCopy,
  isCopySelected,
  onEdit,
  onDelete,
}) => {
  const [selected, setSelected] = useState(false);
  const [pulldownMenuAnchor, setPulldownMenuAnchor] =
    useState<null | HTMLElement>(null);

  useEffect(() => {
    setSelected(isCopySelected ?? false);
  }, [isCopySelected]);

  const handleCopyClicked = () => {
    if (!selected) {
      setSelected(true);
      onCopy!(menu);
    }
  };

  const handleShowMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPulldownMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setPulldownMenuAnchor(null);
  };

  const handleDeleteClicked = () => {
    setPulldownMenuAnchor(null);
    onDelete(menu);
  };

  const handleEditClicked = () => {
    setPulldownMenuAnchor(null);
    onEdit(menu);
  };

  return (
    <>
      <Paper
        className="dummyclassname"
        sx={{ width: "184px", pl: 1, pr: 1, pb: 1 }}
        elevation={3}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "row",
              gap: 1,
            }}
          >
            <Typography variant="caption" fontWeight="bold">
              Cost:
            </Typography>
            <Typography variant="caption">${menu.price.toFixed(2)}</Typography>
          </Box>
          <CopyAll
            onClick={handleCopyClicked}
            sx={{
              color: selected ? "white" : "primary.dark",
              backgroundColor: selected ? "primary.dark" : undefined,
              borderRadius: 1,
              padding: "1px",
              cursor: !selected ? "pointer" : undefined,
            }}
          />
          <IconButton
            color="primary"
            disabled={!menu}
            onClick={handleShowMenu}
            size="small"
          >
            <MoreVert />
          </IconButton>
        </Box>

        <MenuPanel menu={menu} />
      </Paper>
      {!pulldownMenuAnchor ? (
        <></>
      ) : (
        <PulldownMenu
          id="demo-positioned-menu"
          aria-labelledby="demo-positioned-button"
          anchorEl={pulldownMenuAnchor}
          open={true}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <MenuItem onClick={handleEditClicked}>
            <Edit color="primary" />
          </MenuItem>
          <MenuItem onClick={handleDeleteClicked}>
            <Delete color="primary" />
          </MenuItem>
        </PulldownMenu>
      )}
    </>
  );
};

const enum EditType {
  UPDATE_MENU,
  CREATE_MENU,
}
const PlannerPage: React.FC = () => {
  const { menus, setMenus, setSnackbarErrorMsg } = useContext(AppContext);
  const [copiedMenu, setCopiedMenu] = useState<Menu | undefined>();
  const [editMenu, setEditMenu] = useState<Menu | undefined>();
  const [typeOfEdit, setTypeOfEdit] = useState<EditType>();
  const [search, setSearch] = useState("");
  const [filteredMenus, setFilteredMenus] = useState<Menu[]>([]);

  let nextSchoolDay = new Date();
  if (nextSchoolDay.getDay() % 6 === 0) {
    nextSchoolDay = new Date(
      DateTimeUtils.addDays(nextSchoolDay, (nextSchoolDay.getDay() + 1) % 5)
    );
  }

  const startingMonth = nextSchoolDay.getMonth();
  const months: number[] = [];
  for (let i = 0; i < 12; i++) {
    months.push(startingMonth + i);
  }

  const handleCopyMenu = (menu: Menu) => {
    setCopiedMenu(menu);
  };

  const handleDeleteMenu = async (menuToDelete: Menu) => {
    try {
      await deleteMenu(menuToDelete.id);
      if (menuToDelete === copiedMenu) {
        setCopiedMenu(undefined);
      }
      setMenus(menus.filter((menu) => menu !== menuToDelete));
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error deleting menu: " +
        (axiosError.response?.data?.toString() ?? axiosError.response?.statusText ?? "Unknown server error")
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
          (item) => item.name.toLowerCase().indexOf(search.toLowerCase()) >= 0
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
      <Box p={1} sx={{ overflowY: "auto" }}>
        <MealCalendar clipboardMenu={copiedMenu} />
      </Box>
      <Box
        sx={{
          borderTopWidth: 1,
          borderTopColor: "black",
          borderTopStyle: "solid",
          backgroundColor: "lightgray",
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
      <Box
        sx={{
          overflowX: "auto",
          backgroundColor: "lightgray",
          pb: 1,
          pl: 2,
          pr: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "stretch",
            width: "fit-content",
          }}
        >
          {filteredMenus.map((menu) => (
            <TemplateMenu
              key={menu.id}
              isCopySelected={copiedMenu === menu}
              onCopy={handleCopyMenu}
              onEdit={handleEditMenu}
              onDelete={handleDeleteMenu}
              menu={menu}
            />
          ))}
        </Box>
      </Box>
      {(typeOfEdit === EditType.CREATE_MENU ||
        typeOfEdit === EditType.UPDATE_MENU) && (
        <EditMenuDialog
          menu={editMenu}
          onCancel={handleCancelEditMenu}
          onOk={handleMenuSaved}
        />
      )}
    </Box>
  );
};

export default PlannerPage;
