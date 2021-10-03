import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ProfileType } from '@app/profile/interfaces/profile.type';
import { ProfileResponseInterface } from '@app/profile/interfaces/profileResponse.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/entities/user.entity';
import { Repository } from 'typeorm';
import { FollowEntity } from '@app/profile/entities/follow.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async getProfile(
    currentUserId: number,
    profileUserName: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({
      username: profileUserName,
    });

    if (!user)
      throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND);

    const follow = await this.followRepository.findOne({
      followerId: currentUserId,
      followingId: user.id,
    });

    return { ...user, following: !!follow };
  }

  buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
    delete profile.email;
    return { profile };
  }

  async followProfile(
    currentUserId: number,
    profileUserName: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({
      username: profileUserName,
    });
    console.log(currentUserId, user.id);
    if (!user)
      throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND);

    if (currentUserId == user.id)
      throw new HttpException(
        'Follower and fallowing cant be equal',
        HttpStatus.CONFLICT,
      );

    const follow = await this.followRepository.findOne({
      followerId: currentUserId,
      followingId: user.id,
    });

    if (!follow) {
      const followToCreate = new FollowEntity();
      followToCreate.followerId = currentUserId;
      followToCreate.followingId = user.id;
      await this.followRepository.save(followToCreate);
    }

    return { ...user, following: true };
  }

  async unfollowProfile(
    currentUserId: number,
    profileUserName: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({
      username: profileUserName,
    });

    if (!user)
      throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND);

    if (currentUserId == user.id)
      throw new HttpException(
        'Follower and fallowing cant be equal',
        HttpStatus.CONFLICT,
      );

    await this.followRepository.delete({
      followerId: currentUserId, // ищем того кто подписывается
      followingId: user.id, // ищем того на кого подписывается
    });

    return { ...user, following: false };
  }
}
