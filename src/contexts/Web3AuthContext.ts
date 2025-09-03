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

export interface TokenBalance {
  neyxt: string;
  native: string; // ETH or POL
  usdc: string;
  weth: string;
}

export interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: IProvider | null;
  user: UserInfo | null;
  isLoading: boolean;
  isRestoringSession: boolean;
  isConnected: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<UserInfo | null>;
  getAccounts: () => Promise<string[]>;
  // Token operations
  getChainId: () => Promise<string>;
  getTokenBalances: () => Promise<TokenBalance>;
  getNEYXTBalance: () => Promise<string>;
  getNativeBalance: () => Promise<string>;
  sendNEYXT: (recipient: string, amount: string) => Promise<string | Error>;
  sendNative: (recipient: string, amount: string) => Promise<string | Error>;
  signMessage: () => Promise<string>;
  ensureTokenApproval: (spenderAddress: string, amount: string) => Promise<boolean>;
}

export const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  user: null,
  isLoading: true,
  isRestoringSession: false,
  isConnected: false,
  login: async () => {},
  logout: async () => {},
  getUserInfo: async () => null,
  getAccounts: async () => [],
  // Token operations defaults
  getChainId: async () => '',
  getTokenBalances: async () => ({ neyxt: '0', native: '0', usdc: '0', weth: '0' }),
  getNEYXTBalance: async () => '0',
  getNativeBalance: async () => '0',
  sendNEYXT: async () => '',
  sendNative: async () => '',
  signMessage: async () => '',
  ensureTokenApproval: async () => false,
}); 