export type AuthenticatedUserRole = 'USER' | 'ADMIN';

export interface AuthenticatedUser {
  id: number;
  role?: AuthenticatedUserRole;
}
