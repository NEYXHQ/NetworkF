import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage = () => {
  const { isAuthenticated } = useAuth0();

  useEffect(() => {
    // Redirect to home if already authenticated
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
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
          Connect with verified founders and entrepreneurs
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