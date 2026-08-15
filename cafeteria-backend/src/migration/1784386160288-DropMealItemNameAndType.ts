import { MigrationInterface, QueryRunner } from "typeorm";

export class DropMealItemNameAndType1784386160288 implements MigrationInterface {
    name = 'DropMealItemNameAndType1784386160288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meal_item\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`meal_item\` DROP COLUMN \`type\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meal_item\` ADD \`type\` enum ('0', '1', '2', '3') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`meal_item\` ADD \`name\` varchar(255) NOT NULL`);
        await queryRunner.query(`
            UPDATE \`meal_item\` mi
            INNER JOIN \`pantry_item\` pi ON pi.id = mi.pantryItemId
            SET mi.name = pi.name, mi.type = pi.type
        `);
    }

}
