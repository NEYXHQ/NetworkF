import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { useEffect } from 'react';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage = () => {
  const { isConnected } = useWeb3Auth();

  useEffect(() => {
    // Redirect to home if already connected
    if (isConnected) {
      window.location.href = '/';
    }
  }, [isConnected]);

  if (isConnected) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">NetworkF2</h1>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Join the Network
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Connect with verified founders and entrepreneurs.<br/>
          Your crypto wallet will be created automatically.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}; 