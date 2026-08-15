import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkDailyMenuItemToPantryItem1784314653367 implements MigrationInterface {
    name = 'LinkDailyMenuItemToPantryItem1784314653367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` ADD \`pantryItemId\` int NULL`);
        await queryRunner.query(`
            UPDATE \`daily_menu_item\` dmi
            INNER JOIN \`daily_menu\` dm ON dm.id = dmi.menuId
            INNER JOIN \`school_year\` sy ON sy.id = dm.schoolYearId
            INNER JOIN \`pantry_item\` pi ON pi.name = dmi.name AND pi.schoolId = sy.schoolId
            SET dmi.pantryItemId = pi.id
        `);
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` ADD CONSTRAINT \`FK_daily_menu_item_pantry_item\` FOREIGN KEY (\`pantryItemId\`) REFERENCES \`pantry_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` DROP FOREIGN KEY \`FK_daily_menu_item_pantry_item\``);
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` DROP COLUMN \`pantryItemId\``);
    }

}
