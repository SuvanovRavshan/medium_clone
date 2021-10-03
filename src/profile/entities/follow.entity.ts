import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

//без typeorm manytomany
@Entity({ name: 'follows' })
export class FollowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  followerId: number;

  @Column()
  followingId: number;
}
