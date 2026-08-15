import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPantryItemArchived1784403000000 implements MigrationInterface {
    name = 'AddPantryItemArchived1784403000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pantry_item\` ADD \`archived\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pantry_item\` DROP COLUMN \`archived\``);
    }

}
