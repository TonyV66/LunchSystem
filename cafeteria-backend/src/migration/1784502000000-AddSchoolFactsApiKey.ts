import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchoolFactsApiKey1784502000000 implements MigrationInterface {
    name = 'AddSchoolFactsApiKey1784502000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`school\` ADD \`factsApiKey\` varchar(255) NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`school\` DROP COLUMN \`factsApiKey\``);
    }

}
