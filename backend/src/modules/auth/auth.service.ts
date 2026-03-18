import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async validateToken(token: string): Promise<any> {
    // La validación la hace JwtStrategy automáticamente
    return true;
  }

  hasRole(user: any, role: string): boolean {
    return user.roles?.includes(role) || false;
  }

  hasAnyRole(user: any, roles: string[]): boolean {
    return roles.some(role => this.hasRole(user, role));
  }
}