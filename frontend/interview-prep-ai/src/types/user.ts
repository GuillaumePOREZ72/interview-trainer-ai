// Type pour l'utilisateur
export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

// Type pour la réponse de login/signup
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Type pour le UserContext
export interface UserContextType {
  user: User | null;
  loading: boolean;
  updateUser: (userData: AuthResponse) => void;
  clearUser: () => void;
}
