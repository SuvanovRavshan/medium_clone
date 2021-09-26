import { UserType } from '@app/user/interfaces/user.type';

export interface UserResponseInterface {
  user: UserType & { token: string };
}
