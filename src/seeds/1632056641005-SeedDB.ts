import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDb1632056641005 implements MigrationInterface {
  name = 'SeedDb1632056641005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO tags (name) VALUES ('dragons'), ('coffee'), ('nestjs')`,
    );

    //password is gfhfif22
    await queryRunner.query(
      `INSERT INTO users (username,email,password) VALUES ('ravshan', 'admin@gmail.com', '$2b$10$f/enpdC5yHdZ8D2t9GuHb.H/TnwWggZzYjAYr5DibS6huC5mA8ZES')`,
    );

    await queryRunner.query(
      `INSERT INTO articles (slug,title,description, body, "tagList", "authorId") VALUES ('first-article', 'First article', 'first articles desc', 'content article', 'coffee,dragons', 1)`,
    );
  }

  public async down(): Promise<void> {}
}
