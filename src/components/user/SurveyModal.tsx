import { useState } from 'react';
import { X, Lightbulb, Building2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (entityName: string, foundingIdea: string) => void;
  userName?: string;
}

export const SurveyModal = ({ isOpen, onClose, onComplete, userName }: SurveyModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [entityName, setEntityName] = useState('');
  const [foundingIdea, setFoundingIdea] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep === 1 && entityName.trim()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = () => {
    if (entityName.trim() && foundingIdea.trim()) {
      onComplete(entityName.trim(), foundingIdea.trim());
    }
  };

  const isStep1Valid = entityName.trim().length > 0;
  const isStep2Valid = foundingIdea.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-black border border-teal-blue/30 rounded-xl shadow-2xl w-full max-w-md relative">
        {/* Header */}
        <div className="bg-slate-gray rounded-t-xl p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-soft-white/60 hover:text-soft-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="mb-4">
            {currentStep === 1 ? (
              <Building2 className="h-12 w-12 text-princeton-orange mx-auto mb-3" />
            ) : (
              <Lightbulb className="h-12 w-12 text-teal-blue mx-auto mb-3" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-soft-white mb-2">
            Welcome, {userName || 'Founder'}! 👋
          </h2>
          <p className="text-soft-white/70 text-sm">
            Step {currentStep} of 2 • Help us know you better
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-2 bg-slate-gray rounded-full overflow-hidden">
              <div 
                className="h-full bg-princeton-orange transition-all duration-300 ease-out"
                style={{ width: currentStep === 1 ? '50%' : '100%' }}
              />
            </div>
            <span className="text-xs text-soft-white/60 font-medium">
              {currentStep}/2
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2">
          {currentStep === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-soft-white mb-3">
                  <Building2 className="h-4 w-4 inline mr-2 text-princeton-orange" />
                  What is the name of one entity you founded?
                </label>
                <input
                  type="text"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="e.g., TechStart Inc, My Design Studio, The Local Cafe..."
                  className="w-full px-4 py-3 bg-slate-gray border border-teal-blue/20 rounded-lg text-soft-white placeholder-soft-white/40 focus:outline-none focus:ring-2 focus:ring-princeton-orange focus:border-transparent transition-all"
                  autoFocus
                />
                <p className="text-xs text-soft-white/50 mt-2">
                  This can be any company, project, or venture you started
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-soft-white mb-3">
                  <Lightbulb className="h-4 w-4 inline mr-2 text-teal-blue" />
                  How did you get the idea for <span className="text-princeton-orange font-semibold">{entityName}</span>?
                </label>
                <textarea
                  value={foundingIdea}
                  onChange={(e) => setFoundingIdea(e.target.value)}
                  placeholder="Share your story... What problem did you notice? What inspired you? What was the 'aha' moment?"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-gray border border-teal-blue/20 rounded-lg text-soft-white placeholder-soft-white/40 focus:outline-none focus:ring-2 focus:ring-teal-blue focus:border-transparent transition-all resize-none"
                  autoFocus
                />
                <p className="text-xs text-soft-white/50 mt-2">
                  Tell us the story behind your founding journey
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <div className="flex justify-between items-center">
            {currentStep === 1 ? (
              <>
                <div></div>
                <Button
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className="px-6"
                >
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="px-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isStep2Valid}
                  className="px-6"
                >
                  Complete Survey
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-princeton-orange rounded-full opacity-60"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-teal-blue rounded-full opacity-40"></div>
      </div>
    </div>
  );
};

export default SurveyModal;