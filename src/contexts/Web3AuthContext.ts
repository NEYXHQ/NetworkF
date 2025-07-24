import { createContext } from 'react';
import type { Web3Auth } from '@web3auth/modal';
import type { IProvider } from '@web3auth/base';

export interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  aggregateVerifier?: string;
  verifier?: string;
  verifierId?: string;
  typeOfLogin?: string;
}

export interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: IProvider | null;
  user: UserInfo | null;
  isLoading: boolean;
  isConnected: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<UserInfo | null>;
  getAccounts: () => Promise<string[]>;
}

export const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  user: null,
  isLoading: true,
  isConnected: false,
  login: async () => {},
  logout: async () => {},
  getUserInfo: async () => null,
  getAccounts: async () => [],
}); 