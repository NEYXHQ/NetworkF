import { Button } from '../components/ui/Button';
import { ArrowRight, Users, Zap, Shield } from 'lucide-react';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-blue-600">NetworkF2</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect, collaborate, and grow your professional network. 
              The modern platform for meaningful business relationships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started
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
              Built for modern professionals who value authentic connections
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Networking
              </h3>
              <p className="text-gray-600">
                AI-powered matching connects you with relevant professionals in your industry
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
                Modern tech stack ensures blazing fast performance and real-time updates
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
                Your data is secure with enterprise-grade encryption and privacy controls
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your networking?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals already growing their networks
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
            Start Your Journey
          </Button>
        </div>
      </section>
    </div>
  );
}; 