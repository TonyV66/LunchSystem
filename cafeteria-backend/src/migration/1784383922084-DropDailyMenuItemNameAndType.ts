import { MigrationInterface, QueryRunner } from "typeorm";

export class DropDailyMenuItemNameAndType1784383922084 implements MigrationInterface {
    name = 'DropDailyMenuItemNameAndType1784383922084'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` DROP COLUMN \`type\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` ADD \`type\` enum ('0', '1', '2', '3') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` ADD \`name\` varchar(255) NOT NULL`);
        await queryRunner.query(`
            UPDATE \`daily_menu_item\` dmi
            INNER JOIN \`pantry_item\` pi ON pi.id = dmi.pantryItemId
            SET dmi.name = pi.name, dmi.type = pi.type
        `);
    }

}
