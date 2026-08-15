import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegisteredSchoolUser1784507000000 implements MigrationInterface {
    name = 'AddRegisteredSchoolUser1784507000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`registered_school_user\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`status\` varchar(255) NOT NULL DEFAULT 'pending',
                \`role\` int NOT NULL DEFAULT '2',
                \`availableCredits\` decimal(5,2) NOT NULL DEFAULT '0.00',
                \`surveyCompleted\` tinyint NOT NULL DEFAULT 0,
                \`factsId\` int NULL,
                \`userId\` int NULL,
                \`schoolId\` int NULL,
                UNIQUE INDEX \`IDX_registered_school_user_user_school\` (\`userId\`, \`schoolId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`registered_school_user\`
            ADD CONSTRAINT \`FK_registered_school_user_user\`
            FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`registered_school_user\`
            ADD CONSTRAINT \`FK_registered_school_user_school\`
            FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`)
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            INSERT INTO \`registered_school_user\`
                (\`status\`, \`role\`, \`availableCredits\`, \`surveyCompleted\`, \`factsId\`, \`userId\`, \`schoolId\`)
            SELECT
                \`status\`,
                \`role\`,
                \`availableCredits\`,
                \`surveyCompleted\`,
                \`factsId\`,
                \`id\`,
                \`schoolId\`
            FROM \`user\`
            WHERE \`schoolId\` IS NOT NULL
        `);

        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_709e51110daa2b560f0fc32367b\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`factsId\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`surveyCompleted\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`availableCredits\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`role\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`status\``);
        // ALGORITHM=COPY avoids MySQL tmpdir issues seen with the default rebuild path.
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`schoolId\`, ALGORITHM=COPY`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`factsId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`surveyCompleted\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`availableCredits\` decimal(5,2) NOT NULL DEFAULT '0.00'`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`role\` int NOT NULL DEFAULT '2'`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`status\` varchar(255) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`schoolId\` int NULL`);

        await queryRunner.query(`
            UPDATE \`user\` u
            INNER JOIN \`registered_school_user\` rsu ON rsu.userId = u.id
            SET
                u.\`status\` = rsu.\`status\`,
                u.\`role\` = rsu.\`role\`,
                u.\`availableCredits\` = rsu.\`availableCredits\`,
                u.\`surveyCompleted\` = rsu.\`surveyCompleted\`,
                u.\`factsId\` = rsu.\`factsId\`,
                u.\`schoolId\` = rsu.\`schoolId\`
        `);

        await queryRunner.query(`
            ALTER TABLE \`user\`
            ADD CONSTRAINT \`FK_709e51110daa2b560f0fc32367b\`
            FOREIGN KEY (\`schoolId\`) REFERENCES \`school\`(\`id\`)
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`ALTER TABLE \`registered_school_user\` DROP FOREIGN KEY \`FK_registered_school_user_school\``);
        await queryRunner.query(`ALTER TABLE \`registered_school_user\` DROP FOREIGN KEY \`FK_registered_school_user_user\``);
        await queryRunner.query(`DROP INDEX \`IDX_registered_school_user_user_school\` ON \`registered_school_user\``);
        await queryRunner.query(`DROP TABLE \`registered_school_user\``);
    }

}
