import { Menu, DailyMenu, PantryItem } from "../../models/Menu";

export default class MenuDTO extends Menu {
    items: PantryItem[];
}

export class DailyMenuDTO extends DailyMenu {
    items: PantryItem[];
}
