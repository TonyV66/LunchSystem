import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceUserPendingWithStatus1784506000000 implements MigrationInterface {
    name = 'ReplaceUserPendingWithStatus1784506000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`status\` varchar(255) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`UPDATE \`user\` SET \`status\` = CASE WHEN \`pending\` = 1 THEN 'pending' ELSE 'active' END`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`pending\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`pending\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`UPDATE \`user\` SET \`pending\` = CASE WHEN \`status\` = 'pending' THEN 1 ELSE 0 END`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`status\``);
    }

}
