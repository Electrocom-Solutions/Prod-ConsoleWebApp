/**
 * Authentication utilities and types
 */

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  is_staff: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthorized: boolean; // Staff or superuser
  isLoading: boolean;
}


