import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '@app/user/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
import { sign } from 'jsonwebtoken';
import { JWT_SECRET } from '@app/config';
import { UserResponseInterface } from '@app/user/interfaces/userResponse.interface';
import { AuthUserDto } from '@app/user/dto/auth-user.dto';
import { compare } from 'bcrypt';
import { UpdateUserDto } from '@app/user/dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const sameUser = await this.userRepository.findOne({
      email: createUserDto.email,
    });
    if (sameUser)
      throw new HttpException(
        'Email already exist',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);
    const genUser = await this.userRepository.save(newUser);
    delete genUser.password;
    delete genUser.id;
    return genUser;
  }

  async login(authUserDto: AuthUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne(
      {
        email: authUserDto.email,
      },
      { select: ['username', 'bio', 'image', 'password', 'email', 'id'] },
    );
    if (!user)
      throw new HttpException(
        'Credentials are not valid',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    const isPasswordCorrect = compare(authUserDto.password, user.password);
    if (!isPasswordCorrect)
      throw new HttpException(
        'Credentials are not valid',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    delete user.password;
    return user;
  }

  generateJwt(user: UserEntity): string {
    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      JWT_SECRET,
    );
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    return {
      user: {
        ...user,
        token: this.generateJwt(user),
      },
    };
  }

  findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne(id);
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    if (updateUserDto.email) {
      const sameEmail = await this.userRepository.findOne({
        email: updateUserDto.email,
      });
      if (sameEmail)
        throw new HttpException(
          'Email already exist',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }
    const user = await this.findById(userId);
    Object.assign(user, updateUserDto);
    delete user.password;
    return await this.userRepository.save(user);
  }
}
