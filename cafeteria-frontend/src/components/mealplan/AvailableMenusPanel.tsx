import React from "react";
import { Box } from "@mui/material";
import Menu from "../../models/Menu";
import TemplateMenu from "./TemplateMenu";
import { grey } from "@mui/material/colors";

interface AvailableMenusPanelProps {
  filteredMenus: Menu[];
  copiedMenu?: Menu;
  onCopyMenu: (menu: Menu) => void;
  onEditMenu: (menu: Menu) => void;
  onDeleteMenu: (menu: Menu) => void;
}

const AvailableMenusPanel: React.FC<AvailableMenusPanelProps> = ({
  filteredMenus,
  copiedMenu,
  onCopyMenu,
  onEditMenu,
  onDeleteMenu,
}) => {
  return (
    <Box
      className="availableMenus"
      sx={{
        overflowY: "auto",
        backgroundColor: grey[100],
        pb: 1,
        pl: 4,
        pr: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "stretch",
          flexWrap: "wrap",
          maxHeight: "300px",
        }}
      >
        {filteredMenus.map((menu) => (
          <TemplateMenu
            key={menu.id}
            isCopySelected={copiedMenu === menu}
            onCopy={onCopyMenu}
            onEdit={onEditMenu}
            onDelete={onDeleteMenu}
            menu={menu}
          />
        ))}
      </Box>
    </Box>
  );
};

export default AvailableMenusPanel;
