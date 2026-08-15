import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchoolYearFactsId1784503000000 implements MigrationInterface {
    name = 'AddSchoolYearFactsId1784503000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`school_year\` ADD \`factsId\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`school_year\` DROP COLUMN \`factsId\``);
    }

}
