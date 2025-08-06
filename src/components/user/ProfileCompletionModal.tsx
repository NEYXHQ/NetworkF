import { useState } from 'react';
import { X, Target, Users, Lightbulb, Handshake, DollarSign, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (lookingFor: string) => void;
  userName?: string;
}

const lookingForOptions = [
  {
    id: 'co-founder',
    label: 'Co-founder',
    description: 'Looking for someone to build my company with',
    icon: Handshake,
    color: 'text-purple-500'
  },
  {
    id: 'investors',
    label: 'Investors',
    description: 'Seeking funding for my startup',
    icon: DollarSign,
    color: 'text-green-500'
  },
  {
    id: 'mentors',
    label: 'Mentors',
    description: 'Want guidance from experienced founders',
    icon: BookOpen,
    color: 'text-blue-500'
  },
  {
    id: 'customers',
    label: 'Early Customers',
    description: 'Looking for users to try my product/service',
    icon: Users,
    color: 'text-orange-500'
  },
  {
    id: 'feedback',
    label: 'Feedback & Ideas',
    description: 'Want to validate and improve my concept',
    icon: Lightbulb,
    color: 'text-yellow-500'
  },
  {
    id: 'network',
    label: 'Professional Network',
    description: 'Building connections with fellow founders',
    icon: Target,
    color: 'text-teal-500'
  }
];

export const ProfileCompletionModal = ({ isOpen, onClose, onComplete, userName }: ProfileCompletionModalProps) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [showCustom, setShowCustom] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const lookingFor = showCustom && customInput.trim() 
      ? customInput.trim() 
      : lookingForOptions.find(opt => opt.id === selectedOption)?.label || '';
    
    if (lookingFor) {
      onComplete(lookingFor);
    }
  };

  const isValid = selectedOption || (showCustom && customInput.trim());

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-black border border-teal-blue/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="bg-slate-gray rounded-t-xl p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-soft-white/60 hover:text-soft-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="mb-4">
            <Target className="h-12 w-12 text-princeton-orange mx-auto mb-3" />
          </div>
          
          <h2 className="text-2xl font-bold text-soft-white mb-2">
            Complete Your Profile
          </h2>
          <p className="text-soft-white/70 text-sm">
            Help us understand what you're looking for, {userName || 'Founder'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-soft-white mb-2">
              What are you primarily looking for in the WFounders network?
            </h3>
            <p className="text-soft-white/60 text-sm">
              This helps us connect you with the right founders and opportunities.
            </p>
          </div>

          {/* Options Grid */}
          <div className="space-y-3 mb-6">
            {lookingForOptions.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.id}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedOption === option.id
                      ? 'border-princeton-orange bg-princeton-orange/10'
                      : 'border-slate-gray hover:border-teal-blue/50 bg-slate-gray/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="lookingFor"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => {
                      setSelectedOption(e.target.value);
                      setShowCustom(false);
                    }}
                    className="sr-only"
                  />
                  <Icon className={`h-6 w-6 mr-4 ${option.color}`} />
                  <div className="flex-1">
                    <div className="font-medium text-soft-white">{option.label}</div>
                    <div className="text-sm text-soft-white/60">{option.description}</div>
                  </div>
                  {selectedOption === option.id && (
                    <div className="w-5 h-5 bg-princeton-orange rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-soft-white rounded-full"></div>
                    </div>
                  )}
                </label>
              );
            })}

            {/* Custom Option */}
            <div
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                showCustom
                  ? 'border-princeton-orange bg-princeton-orange/10'
                  : 'border-slate-gray hover:border-teal-blue/50 bg-slate-gray/30'
              }`}
            >
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="lookingFor"
                  checked={showCustom}
                  onChange={() => {
                    setShowCustom(true);
                    setSelectedOption('');
                  }}
                  className="sr-only"
                />
                <Target className="h-6 w-6 mr-4 text-soft-white/60" />
                <div className="flex-1">
                  <div className="font-medium text-soft-white">Something else</div>
                  <div className="text-sm text-soft-white/60">Tell us what you're looking for</div>
                </div>
                {showCustom && (
                  <div className="w-5 h-5 bg-princeton-orange rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-soft-white rounded-full"></div>
                  </div>
                )}
              </label>
              
              {showCustom && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="What are you looking for?"
                    className="w-full px-3 py-2 bg-charcoal-black border border-teal-blue/20 rounded text-soft-white placeholder-soft-white/40 focus:outline-none focus:ring-2 focus:ring-princeton-orange focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-teal-blue/10 border border-teal-blue/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-teal-blue">
              💡 <strong>Why we ask:</strong> This information helps us personalize your experience 
              and connect you with founders who complement your needs. We're building WFounders 
              based on what our community is looking for.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="px-8"
            >
              Complete Profile
            </Button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-princeton-orange rounded-full opacity-60"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-teal-blue rounded-full opacity-40"></div>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;