import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMenuItemPrice1784401000000 implements MigrationInterface {
    name = 'AddMenuItemPrice1784401000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`menu_item\` ADD \`price\` decimal(5,2) NOT NULL DEFAULT '0.00'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`menu_item\` DROP COLUMN \`price\``);
    }

}
