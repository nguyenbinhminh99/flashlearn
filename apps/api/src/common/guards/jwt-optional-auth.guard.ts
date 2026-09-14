import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '../types/auth-user';

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthUser>(
    err: Error | null,
    user: TUser | false,
  ): TUser | null {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
