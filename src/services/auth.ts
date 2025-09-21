// src/services/auth.ts
import { apiPost } from '../api/client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    nombreCompleto: string;
    nombreUsuario: string;
    correo: string;
    telefono?: string;
    identificacion?: string;
    estado: string;
    nombreGrupo?: string;
    clienteId?: number;
  };
}

export interface User {
  id: number;
  nombreCompleto: string;
  nombreUsuario: string;
  correo: string;
  telefono?: string;
  identificacion?: string;
  estado: string;
  nombreGrupo?: string;
  clienteId?: number;
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiPost<AuthResponse>('/auth/login', credentials);
      
      // Guardar token y usuario en localStorage
      this.setToken(response.token);
      this.setUser(response.user);
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();
