export class AuthUser {
  id!: string;
  email!: string;
  role!: 'USER' | 'ADMIN';
}

export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: 'USER' | 'ADMIN';
}

export interface AuthResponseUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly user: AuthResponseUser;
}
