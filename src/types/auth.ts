export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  linkedinId?: string;
  createdAt: Date;
  updatedAt: Date;
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