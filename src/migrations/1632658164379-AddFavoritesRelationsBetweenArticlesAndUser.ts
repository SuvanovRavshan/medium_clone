import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFavoritesRelationsBetweenArticlesAndUser1632658164379 implements MigrationInterface {
    name = 'AddFavoritesRelationsBetweenArticlesAndUser1632658164379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users_favorites_article_entity" ("usersId" integer NOT NULL, "articleEntityId" integer NOT NULL, CONSTRAINT "PK_9561ab3052b00a16148608d4ff3" PRIMARY KEY ("usersId", "articleEntityId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bae192cc5b512d56a7f9596a81" ON "users_favorites_article_entity" ("usersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_aed00ed3af66e725b942ce0932" ON "users_favorites_article_entity" ("articleEntityId") `);
        await queryRunner.query(`ALTER TABLE "users_favorites_article_entity" ADD CONSTRAINT "FK_bae192cc5b512d56a7f9596a811" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users_favorites_article_entity" ADD CONSTRAINT "FK_aed00ed3af66e725b942ce09322" FOREIGN KEY ("articleEntityId") REFERENCES "article_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_favorites_article_entity" DROP CONSTRAINT "FK_aed00ed3af66e725b942ce09322"`);
        await queryRunner.query(`ALTER TABLE "users_favorites_article_entity" DROP CONSTRAINT "FK_bae192cc5b512d56a7f9596a811"`);
        await queryRunner.query(`DROP INDEX "IDX_aed00ed3af66e725b942ce0932"`);
        await queryRunner.query(`DROP INDEX "IDX_bae192cc5b512d56a7f9596a81"`);
        await queryRunner.query(`DROP TABLE "users_favorites_article_entity"`);
    }

}
