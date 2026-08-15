import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAndStudentFactsId1784504000000 implements MigrationInterface {
    name = 'AddUserAndStudentFactsId1784504000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`factsId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`student\` ADD \`factsId\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`student\` DROP COLUMN \`factsId\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`factsId\``);
    }

}
