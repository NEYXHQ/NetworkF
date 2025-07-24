import { useContext } from 'react';
import { Web3AuthContext } from '../contexts/Web3AuthContext';

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within Web3AuthProvider');
  }
  return context;
}; 