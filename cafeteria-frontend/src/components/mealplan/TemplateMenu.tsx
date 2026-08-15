import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Menu as PulldownMenu,
  MenuItem as MuiMenuItem,
  Paper,
  Typography,
} from "@mui/material";
import {
  CopyAll,
  Delete,
  Edit,
  MoreVert,
} from "@mui/icons-material";
import Menu from "../../models/Menu";
import MenuPanel from "../menus/MenuPanel";

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
          <MuiMenuItem onClick={handleEditClicked}>
            <Edit color="primary" />
          </MuiMenuItem>
          <MuiMenuItem onClick={handleDeleteClicked}>
            <Delete color="primary" />
          </MuiMenuItem>
        </PulldownMenu>
      )}
    </>
  );
};

export default TemplateMenu;

