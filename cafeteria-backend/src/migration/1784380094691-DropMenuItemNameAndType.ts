import { MigrationInterface, QueryRunner } from "typeorm";

export class DropMenuItemNameAndType1784380094691 implements MigrationInterface {
    name = 'DropMenuItemNameAndType1784380094691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`menu_item\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`menu_item\` DROP COLUMN \`type\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`menu_item\` ADD \`type\` enum ('0', '1', '2', '3') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`menu_item\` ADD \`name\` varchar(255) NOT NULL`);
        await queryRunner.query(`
            UPDATE \`menu_item\` mi
            INNER JOIN \`pantry_item\` pi ON pi.id = mi.pantryItemId
            SET mi.name = pi.name, mi.type = pi.type
        `);
    }

}
