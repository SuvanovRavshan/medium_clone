import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateArticleDto } from '@app/article/dto/create-article.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleEntity } from '@app/article/entities/article.entity';
import { DeleteResult, getRepository, Like, Repository } from 'typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
import slugify from 'slugify';
import { ArticleResponseInterface } from '@app/article/interfaces/articleResponse.interface';
import { UpdateArticleDto } from '@app/article/dto/update-article.dto';
import { ArticlesResponseInterface } from '@app/article/interfaces/articles-response.interface';
import { FollowEntity } from '@app/profile/entities/follow.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async findAll(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');
    queryBuilder.orderBy('articles.created_at', 'DESC');
    const articlesCount = await queryBuilder.getCount();

    if (query.tag) {
      queryBuilder.andWhere('articles.taglist LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        username: query.author,
      });
      queryBuilder.andWhere('articles.authorId = :id', { id: author.id });
    }

    if (query.favorited) {
      const author = await this.userRepository.findOne(
        {
          username: query.favorited,
        },
        {
          relations: ['favorites'],
        },
      );
      const ids = author.favorites.map((el) => el.id);
      if (ids.length > 0)
        queryBuilder.andWhere('articles.authorId IN(:...ids)', { ids });
      else queryBuilder.andWhere('1=0');
    }

    if (query.limit) queryBuilder.limit(query.limit);
    if (query.offset) queryBuilder.offset(query.offset);

    let favoriteIds: number[] = [];

    if (currentUserId) {
      const currentUser = await this.userRepository.findOne(currentUserId, {
        relations: ['favorites'],
      });
      favoriteIds = currentUser.favorites.map((favorite) => favorite.id);
    }

    const articles = await queryBuilder.getMany();
    const articlesWithFavorites = articles.map((article) => {
      const favorited = favoriteIds.includes(article.id);
      return { ...article, favorited };
    });

    return { articles: articlesWithFavorites, articlesCount };
  }

  async createArticle(
    author: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, createArticleDto);
    if (!article.tagList) {
      article.tagList = [];
    }
    article.slug = this.getSlug(article.title);
    return await this.articleRepository.save({
      ...article,
      author,
    });
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return {
      article,
    };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }

  async getBySlug(slug: string): Promise<ArticleEntity> {
    const searchingArticle = await this.articleRepository.findOne({
      slug: Like(`%${slug}%`),
    });
    if (!searchingArticle)
      throw new HttpException('Not founded', HttpStatus.NOT_FOUND);
    return await this.articleRepository.save(searchingArticle);
  }

  async deleteArticle(
    slug: string,
    currentUserId: number,
  ): Promise<DeleteResult> {
    const article = await this.articleRepository.findOne({ slug });

    if (!article)
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);

    if (article.author.id !== currentUserId)
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);

    return await this.articleRepository.delete({ slug });
  }

  async updateArticle(
    slug: string,
    currentUserId: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.getBySlug(slug);
    if (!article)
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
    if (article.author.id !== currentUserId)
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
    Object.assign(article, updateArticleDto);
    if (updateArticleDto.title) article.slug = this.getSlug(article.title);
    return this.articleRepository.save(article);
  }

  async addArticleToFavorites(
    currentUserId: number,
    slug: string,
  ): Promise<ArticleEntity> {
    const article = await this.getBySlug(slug);
    const user = await this.userRepository.findOne(currentUserId, {
      relations: ['favorites'],
    });
    const isNotFavorited =
      user.favorites.findIndex(
        (articleInFavorites) => articleInFavorites.id === article.id,
      ) === -1;

    if (isNotFavorited) {
      user.favorites.push(article);
      article.favoritesCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async deleteArticleFromFavorites(
    currentUserId: number,
    slug: string,
  ): Promise<ArticleEntity> {
    const article = await this.getBySlug(slug);
    const user = await this.userRepository.findOne(currentUserId, {
      relations: ['favorites'],
    });
    const articleIndex = user.favorites.findIndex(
      (articleInFavorites) => articleInFavorites.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount--;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async getFeed(
    currentUserId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const follows = await this.followRepository.find({
      followingId: currentUserId,
    });

    if (follows.length === 0) return { articles: [], articlesCount: 0 };

    const followingUserIds = follows.map((follow) => follow.followingId);
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', { ids: followingUserIds });

    queryBuilder.orderBy('articles.created_at', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) queryBuilder.limit(query.limit);
    if (query.offset) queryBuilder.offset(query.offset);

    const articles = await queryBuilder.getMany();

    return { articles, articlesCount };
  }
}
