import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkMealItemToPantryItem1784313906077 implements MigrationInterface {
    name = 'LinkMealItemToPantryItem1784313906077'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meal_item\` ADD \`pantryItemId\` int NULL`);
        await queryRunner.query(`
            UPDATE \`meal_item\` mi
            INNER JOIN \`meal\` m ON m.id = mi.mealId
            INNER JOIN \`order\` o ON o.id = m.orderId
            INNER JOIN \`school_year\` sy ON sy.id = o.schoolYearId
            INNER JOIN \`pantry_item\` pi ON pi.name = mi.name AND pi.schoolId = sy.schoolId
            SET mi.pantryItemId = pi.id
        `);
        await queryRunner.query(`ALTER TABLE \`meal_item\` ADD CONSTRAINT \`FK_meal_item_pantry_item\` FOREIGN KEY (\`pantryItemId\`) REFERENCES \`pantry_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`meal_item\` DROP FOREIGN KEY \`FK_meal_item_pantry_item\``);
        await queryRunner.query(`ALTER TABLE \`meal_item\` DROP COLUMN \`pantryItemId\``);
    }

}
