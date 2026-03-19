interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface User {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';

  async login(username: string, password: string): Promise<AuthTokens> {
    const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData.message ?? 'Credenciales invalidas'); }

    const tokens: AuthTokens = await response.json();
    
    // Guardar tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, tokens.access_token);
      if (tokens.refresh_token) localStorage.setItem(this.REFRESH_KEY, tokens.refresh_token);
      
      // Decodificar y guardar datos del usuario
      const userData = this.decodeToken(tokens.access_token);
            const normalizedUser = {
        ...userData,
        roles: userData.roles ?? (userData.role ? [userData.role] : []),
        nombre: userData.nombre,
        apellido: userData.apellido,
        doctorId: userData.doctorId,
        especialidad: userData.especialidad,
      };
      localStorage.setItem('token', tokens.access_token ?? (tokens as any).token ?? '');
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
    }

    return tokens;
  }

  async refreshToken(): Promise<AuthTokens | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const tokens: AuthTokens = await response.json();
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.TOKEN_KEY, tokens.access_token);
        if (tokens.refresh_token) localStorage.setItem(this.REFRESH_KEY, tokens.refresh_token);
        
        const userData = this.decodeToken(tokens.access_token);
              const normalizedUser = {
        ...userData,
        roles: userData.roles ?? (userData.role ? [userData.role] : []),
        nombre: userData.nombre,
        apellido: userData.apellido,
        doctorId: userData.doctorId,
        especialidad: userData.especialidad,
      };
      localStorage.setItem('token', tokens.access_token ?? (tokens as any).token ?? '');
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
      }

      return tokens;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_KEY);
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return roles.some(role => user?.roles?.includes(role)) || false;
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getAccessToken();

    // Si el token estÃƒÂ¡ por expirar, intenta refrescarlo
    if (token) {
      const payload = this.decodeToken(token);
      const now = Date.now() / 1000;
      
      // Si expira en menos de 5 minutos, refrescar
      if (payload.exp - now < 300) {
        await this.refreshToken();
        token = this.getAccessToken();
      }
    }

    const headers = {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return fetch(url, { ...options, headers });
  }
}

export const authService = new AuthService();


