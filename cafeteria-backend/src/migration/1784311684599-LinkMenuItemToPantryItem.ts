import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkMenuItemToPantryItem1784311684599 implements MigrationInterface {
    name = 'LinkMenuItemToPantryItem1784311684599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`menu_item\` ADD \`pantryItemId\` int NULL`);
        await queryRunner.query(`
            UPDATE \`menu_item\` mi
            INNER JOIN \`menu\` m ON m.id = mi.menuId
            INNER JOIN \`pantry_item\` pi ON pi.name = mi.name AND pi.schoolId = m.schoolId
            SET mi.pantryItemId = pi.id
        `);
        await queryRunner.query(`ALTER TABLE \`menu_item\` ADD CONSTRAINT \`FK_menu_item_pantry_item\` FOREIGN KEY (\`pantryItemId\`) REFERENCES \`pantry_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`menu_item\` DROP FOREIGN KEY \`FK_menu_item_pantry_item\``);
        await queryRunner.query(`ALTER TABLE \`menu_item\` DROP COLUMN \`pantryItemId\``);
    }

}
