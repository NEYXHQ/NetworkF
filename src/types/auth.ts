// Basic user interface for Auth0 integration
export interface User {
  sub: string; // Auth0 user ID
  name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
  [key: string]: unknown; // Auth0 can have additional claims
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LinkedInAuthResponse {
  accessToken: string;
  user: {
    id: string;
    localizedFirstName: string;
    localizedLastName: string;
    profilePicture?: {
      displayImage: string;
    };
    emailAddress: string;
  };
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
} 