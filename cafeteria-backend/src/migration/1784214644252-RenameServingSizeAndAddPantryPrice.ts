import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameServingSizeAndAddPantryPrice1784214644252 implements MigrationInterface {
    name = 'RenameServingSizeAndAddPantryPrice1784214644252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pantry_item\` CHANGE \`servingSize\` \`recipeServingSize\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`pantry_item\` ADD \`price\` decimal(5,2) NOT NULL DEFAULT '0.00'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pantry_item\` DROP COLUMN \`price\``);
        await queryRunner.query(`ALTER TABLE \`pantry_item\` CHANGE \`recipeServingSize\` \`servingSize\` int NOT NULL DEFAULT '1'`);
    }

}
