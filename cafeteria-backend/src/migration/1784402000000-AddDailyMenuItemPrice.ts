import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDailyMenuItemPrice1784402000000 implements MigrationInterface {
    name = 'AddDailyMenuItemPrice1784402000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` ADD \`price\` decimal(5,2) NOT NULL DEFAULT '0.00'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`daily_menu_item\` DROP COLUMN \`price\``);
    }

}
