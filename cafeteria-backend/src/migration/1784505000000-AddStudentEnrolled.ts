import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudentEnrolled1784505000000 implements MigrationInterface {
    name = 'AddStudentEnrolled1784505000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`student\` ADD \`enrolled\` tinyint NOT NULL DEFAULT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`student\` DROP COLUMN \`enrolled\``);
    }

}
