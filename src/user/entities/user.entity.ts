import {
  BeforeInsert,
  Column,
  Entity, JoinTable, ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { hash } from 'bcrypt';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ArticleEntity } from '@app/article/entities/article.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Column({ select: false })
  @IsNotEmpty()
  password: string;

  @Column()
  @IsNotEmpty()
  username: string;

  @Column({ default: '' })
  @IsNotEmpty()
  bio: string;

  @Column({ default: '' })
  @IsNotEmpty()
  image: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }

  @OneToMany(() => ArticleEntity, (article: ArticleEntity) => article.author)
  articles: ArticleEntity[];

  @ManyToMany(() => ArticleEntity)
  @JoinTable()
  favorites: ArticleEntity[]; //массив статей которые залайкал пользователь
}
