import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPantryRecipesAndIngredients1784212219641 implements MigrationInterface {
    name = 'AddPantryRecipesAndIngredients1784212219641'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`recipe_item\` (\`id\` int NOT NULL AUTO_INCREMENT, \`qty\` decimal(10,2) NOT NULL DEFAULT '1.00', \`unitOfMeasure\` varchar(255) NULL, \`description\` varchar(255) NOT NULL, \`pantryItemId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ingredient\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`schoolId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`unit_of_measure\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`schoolId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`pantry_item\` ADD \`servingSize\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`recipe_item\` ADD CONSTRAINT \`FK_d79e9dd1cbae325921cb348ed12\` FOREIGN KEY (\`pantryItemId\`) REFERENCES \`pantry_item\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ingredient\` ADD CONSTRAINT \`FK_83753854f8ad1020d862bad544c\` FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`unit_of_measure\` ADD CONSTRAINT \`FK_98d8a68ea69022e87c8be682b99\` FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`unit_of_measure\` DROP FOREIGN KEY \`FK_98d8a68ea69022e87c8be682b99\``);
        await queryRunner.query(`ALTER TABLE \`ingredient\` DROP FOREIGN KEY \`FK_83753854f8ad1020d862bad544c\``);
        await queryRunner.query(`ALTER TABLE \`recipe_item\` DROP FOREIGN KEY \`FK_d79e9dd1cbae325921cb348ed12\``);
        await queryRunner.query(`ALTER TABLE \`pantry_item\` DROP COLUMN \`servingSize\``);
        await queryRunner.query(`DROP TABLE \`unit_of_measure\``);
        await queryRunner.query(`DROP TABLE \`ingredient\``);
        await queryRunner.query(`DROP TABLE \`recipe_item\``);
    }

}
