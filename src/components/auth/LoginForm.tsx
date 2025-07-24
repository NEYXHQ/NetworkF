import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { Button } from '../ui/Button';
import { Linkedin } from 'lucide-react';

export const LoginForm = () => {
  const { login, isLoading, user } = useWeb3Auth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (user) {
    return (
      <div className="text-center">
        <p className="text-green-600 mb-4">✅ Successfully logged in!</p>
        <p className="text-sm text-gray-600">
          Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to NetworkF2
          </h2>
          <p className="text-gray-600">
            Connect with verified founders and entrepreneurs
          </p>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleLogin}
          loading={isLoading}
          disabled={isLoading}
        >
          <Linkedin className="mr-2 h-4 w-4" />
          Sign in with Web3Auth
        </Button>

        <div className="text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our terms and privacy policy.
            Access is limited to verified founders and entrepreneurs.
          </p>
          <p className="mt-2">
            Your wallet will be automatically created upon login.
          </p>
        </div>
      </div>
    </div>
  );
}; 