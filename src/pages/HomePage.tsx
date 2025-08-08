import { useState, useEffect } from 'react';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { useSupabaseUser } from '../hooks/useSupabaseUser';
import { Button } from '../components/ui/Button';
import { TokenBalance } from '../components/wallet/TokenBalance';
import { UserProfile } from '../components/user/UserProfile';
import { SurveyModal } from '../components/user/SurveyModal';
import { AIProfilingModal } from '../components/user/AIProfilingModal';
import { Header } from '../components/layout/Header';
import { ArrowRight } from 'lucide-react';

export const HomePage = () => {
  const { isConnected, login } = useWeb3Auth();
  const { supabaseUser, needsSurvey, needsProfileCompletion, completeSurvey, isLoading } = useSupabaseUser();
  const [showWallet, setShowWallet] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  
  // Track if user has skipped for this session
  const [surveySkipped, setSurveySkipped] = useState(false);
  const [profileSkipped, setProfileSkipped] = useState(false);

  const handleGetStarted = async () => {
    if (isConnected) {
      // Navigate to dashboard or main app
      console.log('Navigate to dashboard');
    } else {
      try {
        await login();
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  };

  // Handle survey completion
  const handleSurveyComplete = async (entityName: string, foundingIdea: string) => {
    const success = await completeSurvey(entityName, foundingIdea);
    if (success) {
      setShowSurvey(false);
      // After survey completion, check if profile completion is needed
      // This will be handled by the useEffect below
    }
  };

  // Profile completion replaced by AI chat modal for testing

  // Handle survey skip
  const handleSurveySkip = () => {
    setSurveySkipped(true);
    setShowSurvey(false);
    console.log('📝 Survey skipped for this session');
  };

  // Handle profile completion skip
  const handleProfileSkip = () => {
    setProfileSkipped(true);
    setShowProfileCompletion(false);
    console.log('🎯 Profile completion skipped for this session');
  };

  // Show survey modal when user needs to complete it (first priority)
  useEffect(() => {
    if (isConnected && needsSurvey && !isLoading && !showSurvey && !surveySkipped) {
      setShowSurvey(true);
      setShowProfileCompletion(false); // Hide profile completion if survey is needed
    }
  }, [isConnected, needsSurvey, isLoading, showSurvey, surveySkipped]);

  // Show profile completion modal when user needs to complete it (second priority)
  useEffect(() => {
    if (isConnected && needsProfileCompletion && !isLoading && !showSurvey && !showProfileCompletion && !profileSkipped) {
      setShowProfileCompletion(true);
    }
  }, [isConnected, needsProfileCompletion, isLoading, showSurvey, showProfileCompletion, profileSkipped]);

  // If user is connected, show only the profile and optionally wallet
  if (isConnected) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #023047 0%, #219ebc 100%)' }}>
        <Header showWallet={showWallet} onToggleWallet={() => setShowWallet(!showWallet)} />
        
        <div className="pt-8 pb-12">
          {/* Wallet Section - Only show if toggled */}
          {showWallet && (
            <section className="py-12 md:py-20" style={{ backgroundColor: 'rgba(2, 48, 71, 0.6)' }}>
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-6 md:mb-8">
                  Your Wallet & NEYXT Tokens
                </h2>
                <TokenBalance />
              </div>
            </section>
          )}

          {/* User Profile Section */}
          <section className="py-12 md:py-20" style={{ backgroundColor: 'rgba(33, 158, 188, 0.15)' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-6 md:mb-8">
                Your Founder Profile
              </h2>
              <UserProfile />
            </div>
          </section>
        </div>

        {/* Survey Modal for New Users */}
        <SurveyModal
          isOpen={showSurvey}
          onClose={handleSurveySkip}
          onComplete={handleSurveyComplete}
          userName={supabaseUser?.name || undefined}
        />

        {/* AI Profiling Modal (replaces profile completion for testing) */}
        <AIProfilingModal
          isOpen={showProfileCompletion}
          onClose={handleProfileSkip}
          systemPrompt={"You are a helpful onboarding assistant for founders. Keep answers concise."}
        />
      </div>
    );
  }

  // Show landing page for non-logged in users
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #023047 0%, #219ebc 100%)' }}>
      <Header />
      
      {/* Hero Section */}
      <section className="pt-16 pb-20 md:pt-20 md:pb-32 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255, 183, 3, 0.05) 0%, rgba(251, 133, 0, 0.05) 100%)' }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                <div>Founders of the world.</div>
                <div>Verified.</div>
                <div>Driven.</div>
                <div>Struggling.</div>
                <div>Building.</div>
                <div>All different.</div>
                <div><span style={{ color: '#8ecae6' }} className="font-semibold">All founders.</span></div>
              </h1>
              <p className="text-lg md:text-xl font-medium mt-6 md:mt-8" style={{ color: '#8ecae6' }}>
                A global tribe of verified founders.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 py-3 md:px-8 md:py-4 border-0 hover:opacity-90 transition-opacity" 
                style={{ backgroundColor: '#f78c01', color: 'white' }}
                onClick={handleGetStarted}
              >
                Join via LinkedIn
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-white/70 mt-3 md:mt-4">
              <em>Verification required. Founders only.</em>
            </p>
          </div>
        </div>
      </section>

      {/* Core Message Section */}
      <section className="py-12 md:py-20" style={{ backgroundColor: 'rgba(2, 48, 71, 0.7)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">
            A global network of Founders
          </h2>
          <h3 className="text-lg md:text-xl font-medium mb-6 md:mb-8" style={{ color: '#8ecae6' }}>
            It's not elitist. It's real.
          </h3>
          <div className="max-w-4xl mx-auto">
            <p className="text-base md:text-lg text-white/80 mb-4 md:mb-6 leading-relaxed">
              Whether you're bootstrapping in Nairobi or scaling in New York, building in a garage or pitching in a boardroom — you belong here.
            </p>
            <h3 className="text-lg md:text-xl font-medium mb-6 md:mb-8" style={{ color: '#8ecae6' }}>
            Different journeys. Same DNA.
          </h3>
            <p className="text-base md:text-lg text-white/80 mb-4 md:mb-6 leading-relaxed">
              You know what it's like: the sleepless nights, the risky bets, the quiet wins.<br />
              You share a rare way of seeing the world.
            </p>
            <p className="text-lg md:text-xl font-semibold mb-6 md:mb-8" style={{ color: '#8ecae6' }}>
              WFounders isn't a tool. It's a movement.
            </p>
            <Button 
              size="lg" 
              className="text-base md:text-lg px-6 py-3 md:px-8 md:py-4 border-0 hover:opacity-90 transition-opacity" 
              style={{ backgroundColor: '#f78c01', color: 'white' }}
              onClick={handleGetStarted}
            >
              Join via LinkedIn
            </Button>
          </div>
        </div>
      </section>

      {/* Invisible Blockchain Section */}
      <section className="py-12 md:py-20" style={{ backgroundColor: 'rgba(33, 158, 188, 0.1)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">
            Powered by blockchain. Invisible to you.
          </h2>
          <p className="text-base md:text-lg text-white/80 mb-8 md:mb-12 max-w-3xl mx-auto">
            We use Web3 to keep things fair, transparent, and founder-first.<br />
            But you'll never see a wallet address unless you want to.
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="text-lg md:text-xl text-white/90 leading-relaxed space-y-2">
              <p>
                <span className="font-semibold" style={{ color: '#8ecae6' }}>Sign in with LinkedIn</span> and 
                <span className="font-semibold" style={{ color: '#8ecae6' }}> we handle the rest</span> — 
                your identity, activity, and rewards all protected and portable.
              </p>
            </div>
          </div>

          <p className="text-center font-medium mt-8 md:mt-12" style={{ color: '#8ecae6' }}>
            <em>Web3 where it matters. Nowhere else.</em>
          </p>
        </div>
      </section>

      {/* The Vision Section */}
      <section className="py-12 md:py-20" style={{ backgroundColor: 'rgba(2, 48, 71, 0.8)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 md:mb-8">
            A network that gives back.
          </h2>
          <p className="text-base md:text-lg text-white/80 mb-8 md:mb-12 max-w-3xl mx-auto">
            WFounders doesn't extract value from members. It <strong style={{ color: '#8ecae6' }}>creates value with them</strong>.
          </p>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 md:p-8 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(142, 202, 230, 0.1)', border: '1px solid rgba(142, 202, 230, 0.2)' }}>
              <p className="text-lg md:text-xl text-white/80 mb-2">Help others?</p>
              <p className="text-lg md:text-xl font-semibold text-white">You grow.</p>
            </div>
            <div className="text-center p-6 md:p-8 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(142, 202, 230, 0.1)', border: '1px solid rgba(142, 202, 230, 0.2)' }}>
              <p className="text-lg md:text-xl text-white/80 mb-2">Grow the network?</p>
              <p className="text-lg md:text-xl font-semibold text-white">You earn.</p>
            </div>
            <div className="text-center p-6 md:p-8 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(142, 202, 230, 0.1)', border: '1px solid rgba(142, 202, 230, 0.2)' }}>
              <p className="text-lg md:text-xl text-white/80 mb-2">Build your reputation?</p>
              <p className="text-lg md:text-xl font-semibold text-white">It stays with you.</p>
            </div>
          </div>

          <p className="text-base md:text-lg font-medium mt-8 md:mt-12" style={{ color: '#8ecae6' }}>
            Because this network runs on trust — and trust is on-chain.
          </p>
        </div>
      </section>

      {/* Why WFounders Section */}
      <section className="py-12 md:py-20" style={{ backgroundColor: 'rgba(33, 158, 188, 0.2)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 md:mb-8">
              A space that's yours — finally.
            </h2>
            <p className="text-base md:text-lg text-white/80 mb-6 md:mb-8">
              WFounders was born from a simple frustration: <strong style={{ color: '#fb8500' }}>the noise</strong>.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl p-6 md:p-8 backdrop-blur-sm" style={{ backgroundColor: 'rgba(2, 48, 71, 0.7)', border: '1px solid rgba(142, 202, 230, 0.3)' }}>
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">We were tired of:</h3>
              <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-white/80 mb-6 md:mb-8">
                <li className="flex items-center">
                  <span style={{ color: '#fb8500' }} className="mr-3">×</span>
                  Growth hackers in our DMs
                </li>
                <li className="flex items-center">
                  <span style={{ color: '#fb8500' }} className="mr-3">×</span>
                  Thought leaders chasing likes
                </li>
                <li className="flex items-center">
                  <span style={{ color: '#fb8500' }} className="mr-3">×</span>
                  Conversations driven by vanity metrics and ulterior motives
                </li>
              </ul>
              
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">So we built something else:</h3>
              <p className="text-base md:text-lg font-medium" style={{ color: '#8ecae6' }}>
                A quieter, cleaner, <strong>realer</strong> space — for actual founders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 md:py-20" style={{ background: 'linear-gradient(135deg, #ffb703 0%, #fb8500 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">
            Ready to join your global tribe?
          </h2>
          <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto">
            Join verified founders from around the world. Build authentic relationships. Create collective value.
          </p>
          <Button
            size="lg"
            className="text-base md:text-lg px-6 py-3 md:px-8 md:py-4 hover:bg-white/90 border-0 font-semibold transition-colors"
            style={{ backgroundColor: 'white', color: '#023047' }}
            onClick={handleGetStarted}
          >
            → Get Verified with LinkedIn
          </Button>
          <p className="text-sm text-white/80 mt-3 md:mt-4">
            <em>WFounders is for real founders only. Verification required.</em>
          </p>
        </div>
      </section>
    </div>
  );
}; 