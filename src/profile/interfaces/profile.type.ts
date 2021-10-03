import { UserType } from '@app/user/interfaces/user.type';

export type ProfileType = UserType & { following: boolean };
