import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '../components/ui/Button';
import { ArrowRight, Users, Zap, Shield, CheckCircle } from 'lucide-react';

export const HomePage = () => {
  const { isAuthenticated, user, loginWithRedirect } = useAuth0();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Navigate to dashboard or main app
      console.log('Navigate to dashboard');
    } else {
      loginWithRedirect({
        authorizationParams: {
          connection: 'linkedin',
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {isAuthenticated && user && (
              <div className="mb-6 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Welcome back, {user.name || user.email}!
              </div>
            )}
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-blue-600">NetworkF2</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The exclusive network for verified founders and entrepreneurs. 
              Connect, collaborate, and grow your business with like-minded professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4" onClick={handleGetStarted}>
                {isAuthenticated ? 'Go to Dashboard' : 'Join the Network'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose NetworkF2?
            </h2>
            <p className="text-xl text-gray-600">
              Built for serious entrepreneurs who value authentic connections
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verified Network
              </h3>
              <p className="text-gray-600">
                Every member is manually verified to ensure you connect with legitimate founders and entrepreneurs
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Modern tech stack with Auth0 integration ensures secure, fast authentication via LinkedIn
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Privacy First
              </h3>
              <p className="text-gray-600">
                Enterprise-grade security with Auth0 and LinkedIn OAuth. Your data is always protected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to join the network?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Connect with verified founders and entrepreneurs today
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-4"
            onClick={handleGetStarted}
          >
            {isAuthenticated ? 'Access Dashboard' : 'Apply Now'}
          </Button>
        </div>
      </section>
    </div>
  );
}; 