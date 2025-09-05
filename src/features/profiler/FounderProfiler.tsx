import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import profilesConfig from '../../../knowledge/FounderProfiler/profiles_config.json';
import questionsBank from '../../../knowledge/FounderProfiler/questions_bank.json';
import { mapFreeTextToScale, summarizeResult, type LLMMapResponse } from '../../services/profilerLLM';
import { saveProfilerResult, getProfilerResult, triggerProfilerAirdrop, type ProfilerResult } from '../../services/profilerService';
import { useSupabaseUser } from '../../hooks/useSupabaseUser';
import { useAirdropService } from '../../hooks/useAirdropService';

type DimensionKey = (typeof profilesConfig)["dimensions"][number]["key"];

interface DimensionState {
  mean: number; // running estimate in [-2,2]
  variance: number; // uncertainty (starts 1.0, decreases with evidence)
}

interface QuestionOption {
  label: string;
  value: number; // -2..2
}

interface QuestionItem {
  id: string;
  style: 'either_or' | 'scenario';
  prompt: string;
  dimension: DimensionKey;
  options: QuestionOption[];
  weight: number;
}

interface AnswerEvent {
  qid: string;
  dimension: DimensionKey;
  value: number; // mapped -2..2
  weight: number;
  llm_confidence?: number;
}

const INITIAL_VARIANCE = 1.0;

function clampToRange(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

function softmaxNegSquared(distances: Record<string, number>): Record<string, number> {
  // Convert distances to probabilities via softmax(-d^2)
  const keys = Object.keys(distances);
  const scores = keys.map((k) => Math.exp(-1 * distances[k]));
  const sum = scores.reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  keys.forEach((k, i) => {
    out[k] = sum > 0 ? scores[i] / sum : 0;
  });
  return out;
}

export const FounderProfiler = () => {
  const { supabaseUser } = useSupabaseUser();
  const { claim: airdropClaim, claimAirdrop, isProcessing: isAirdropProcessing, airdropEnabled } = useAirdropService();
  
  // Build initial dimension state
  const initialDims: Record<DimensionKey, DimensionState> = useMemo(() => {
    const state = {} as Record<DimensionKey, DimensionState>;
    for (const d of profilesConfig.dimensions) {
      state[d.key as DimensionKey] = { mean: 0, variance: INITIAL_VARIANCE };
    }
    return state;
  }, []);

  const [dimState, setDimState] = useState<Record<DimensionKey, DimensionState>>(initialDims);
  const [answers, setAnswers] = useState<AnswerEvent[]>([]);
  const [questionHistory, setQuestionHistory] = useState<string[]>([]); // Track question IDs in order
  const questionList = questionsBank.questions as QuestionItem[];
  // LLM integration state
  const [freeText, setFreeText] = useState<string>('');
  const [clarifyPrompt, setClarifyPrompt] = useState<string>('');
  const [waitingClarification, setWaitingClarification] = useState<boolean>(false);
  const [clarificationsCount, setClarificationsCount] = useState<number>(0);
  const [isMapping, setIsMapping] = useState<boolean>(false);
  const [llmError, setLlmError] = useState<string>('');
  const [finalNarrative, setFinalNarrative] = useState<string>('');
  const [existingProfile, setExistingProfile] = useState<ProfilerResult | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [airdropTriggered, setAirdropTriggered] = useState<boolean>(false);
  const [airdropStatus, setAirdropStatus] = useState<'none' | 'processing' | 'success' | 'error'>('none');

  // Heuristic: pick next question for dimension with highest variance not yet asked too many times
  const nextQuestion = useMemo((): QuestionItem | null => {
    // stop if reached recommended max
    if (answers.length >= (questionsBank.recommended_max_questions || 18)) return null;

    const askedIds = new Set(answers.map((a) => a.qid));
    // Find dimension with highest variance
    const sortedDims = Object.entries(dimState).sort((a, b) => b[1].variance - a[1].variance);
    for (const [dimKey] of sortedDims) {
      const candidate = questionList.find((q) => q.dimension === dimKey && !askedIds.has(q.id));
      if (candidate) return candidate;
    }
    // Fallback: any unanswered question
    const fallback = questionList.find((q) => !askedIds.has(q.id));
    return fallback || null;
  }, [answers, dimState, questionList]);

  // Compute posterior over profiles using squared distance to centroids
  const posterior = useMemo(() => {
    const distances: Record<string, number> = {};
    for (const p of profilesConfig.profiles as Array<{ name: string; centroid: Record<DimensionKey, number> }>) {
      let sumSq = 0;
      for (const d of profilesConfig.dimensions) {
        const key = d.key as DimensionKey;
        const mu = dimState[key].mean;
        const centroid = p.centroid[key];
        const diff = mu - centroid;
        sumSq += diff * diff;
      }
      distances[p.name] = sumSq;
    }
    return softmaxNegSquared(distances);
  }, [dimState]);

  const topProfile = useMemo(() => {
    const entries = Object.entries(posterior);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0] || [null, 0];
  }, [posterior]);

  const progress = useMemo(() => {
    const minQ = questionsBank.recommended_min_questions || 10;
    const maxQ = questionsBank.recommended_max_questions || 18;
    return { count: answers.length, minQ, maxQ };
  }, [answers.length]);

  const shouldStop = useMemo(() => {
    const [, prob] = topProfile;
    const reachedMin = answers.length >= (questionsBank.recommended_min_questions || 10);
    const reachedMax = answers.length >= (questionsBank.recommended_max_questions || 18);
    return reachedMax || (reachedMin && prob >= 0.9);
  }, [answers.length, topProfile]);

  useEffect(() => {
    // When stopping, ask LLM for final summary once and save results
    const run = async () => {
      try {
        if (!shouldStop) return;
        const [profileName, prob] = topProfile;
        if (!profileName) return;
        
        // Get profile type from config
        const profileConfig = profilesConfig.profiles.find(p => p.name === profileName);
        if (!profileConfig) return;
        
        const dims: Record<string, number> = {};
        for (const d of profilesConfig.dimensions) {
          dims[d.key] = dimState[d.key as DimensionKey].mean;
        }
        
        const summary = await summarizeResult({
          profile: profileName,
          confidence: prob,
          alternatives: Object.entries(posterior)
            .sort((a, b) => b[1] - a[1])
            .slice(1, 4)
            .map(([p, pr]) => ({ profile: p, prob: pr })),
        dimensions: dims,
          nQuestions: answers.length,
          nClarifications: clarificationsCount,
        });
        setFinalNarrative(summary.summary);
        
        // Save results to database if user is authenticated
        if (supabaseUser?.id) {
          const profilerResult: ProfilerResult = {
            profileName,
            profileType: profileConfig.type,
            confidence: prob,
            userId: supabaseUser.id
          };
          
          await saveProfilerResult(profilerResult);
          
          // Trigger airdrop if enabled and not already triggered
          if (airdropEnabled && !airdropTriggered && !airdropClaim) {
            setAirdropTriggered(true);
            setAirdropStatus('processing');
            
            try {
              const success = await claimAirdrop();
              setAirdropStatus(success ? 'success' : 'error');
            } catch (error) {
              console.error('Airdrop claim error:', error);
              setAirdropStatus('error');
            }
          }
        }
      } catch (e) {
        console.error('Error in profiler completion:', e);
      }
    };
    void run();
  }, [shouldStop, supabaseUser?.id]);

  // Check for existing profile when component mounts
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!supabaseUser?.id) return;
      
      setIsLoadingProfile(true);
      try {
        const result = await getProfilerResult(supabaseUser.id);
        if (result.success && result.result) {
          setExistingProfile(result.result);
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    checkExistingProfile();
  }, [supabaseUser?.id]);

  const handleAnswer = (q: QuestionItem, value: number) => {
    // Update dimension mean via weighted running average; reduce variance
    const { dimension, weight } = q;
    setAnswers((prev) => [...prev, { qid: q.id, dimension, value, weight }]);
    setQuestionHistory((prev) => [...prev, q.id]); // Track question order
    setDimState((prev) => {
      const current = prev[dimension];
      const w = Math.max(0.1, weight || 1.0);
      const newMean = clampToRange((current.mean * 1 + value * w) / (1 + w), -2, 2);
      const newVar = Math.max(0.2, current.variance * 0.8); // decrease uncertainty gradually
      return { ...prev, [dimension]: { mean: newMean, variance: newVar } };
    });
  };

  const mapWithLLM = async (q: QuestionItem) => {
    if (isMapping) return;
    setIsMapping(true);
    setLlmError('');
    try {
      const response: LLMMapResponse = await mapFreeTextToScale({
        questionPrompt: q.prompt,
        options: q.options,
        userText: waitingClarification && clarifyPrompt ? clarifyPrompt : freeText,
      });
      if ('need_clarification' in response && response.need_clarification) {
        // Show clarifying question once
        setWaitingClarification(true);
        setClarificationsCount((c) => c + 1);
        setClarifyPrompt('');
        // Use response.clarifying_question as placeholder
        setLlmError('Clarification needed: ' + response.clarifying_question);
        return;
      }
      // Success path
      const mapped = response as Extract<LLMMapResponse, { answer_value: number; confidence: number }>;
      handleAnswer(q, mapped.answer_value as number);
      setAnswers((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.qid === q.id) {
          // enrich last answer with confidence
          const enriched = [...prev];
          enriched[enriched.length - 1] = { ...last, llm_confidence: mapped.confidence as number };
          return enriched;
        }
        return prev;
      });
      // Reset inputs
      setFreeText('');
      setClarifyPrompt('');
      setWaitingClarification(false);
      setLlmError('');
    } catch {
      setLlmError('AI mapping failed. You can select an option or try again.');
    } finally {
      setIsMapping(false);
    }
  };

  const handleGoBack = () => {
    if (questionHistory.length === 0) return;
    
    // Get the last question ID and remove it from history
    const lastQuestionId = questionHistory[questionHistory.length - 1];
    setQuestionHistory((prev) => prev.slice(0, -1));
    
    // Remove the last answer from answers array
    const lastAnswerIndex = answers.findIndex((answer, index) => 
      answer.qid === lastQuestionId && index === answers.length - 1
    );
    
    if (lastAnswerIndex !== -1) {
      const lastAnswer = answers[lastAnswerIndex];
      setAnswers((prev) => prev.slice(0, -1));
      
      // Revert the dimension state change (this is approximate since we used weighted averages)
      setDimState((prev) => {
        const current = prev[lastAnswer.dimension];
        const w = Math.max(0.1, lastAnswer.weight || 1.0);
        // Reverse the weighted average calculation (approximate)
        const previousMean = (current.mean * (1 + w) - lastAnswer.value * w) / 1;
        const revertedMean = clampToRange(previousMean, -2, 2);
        const revertedVar = Math.min(1.0, current.variance / 0.8); // Reverse variance reduction
        return { ...prev, [lastAnswer.dimension]: { mean: revertedMean, variance: revertedVar } };
      });
    }
  };

  const reset = () => {
    setDimState(initialDims);
    setAnswers([]);
    setQuestionHistory([]);
    setExistingProfile(null);
    setFinalNarrative('');
  };



  return (
    <div className="min-h-screen bg-slate-gray/20">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-soft-white mb-2">Discover Your Entrepreneurial Profile</h1>
        
        {/* Gamified Introduction */}
        {!existingProfile && !isLoadingProfile && answers.length === 0 && (
          <div className="bg-gradient-to-br from-charcoal-black to-slate-gray/40 border border-teal-blue/30 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-princeton-orange/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-soft-white text-lg font-semibold mb-3">
                  Welcome to Your Entrepreneurial Journey
                </h3>
                <p className="text-soft-white/80 mb-4 leading-relaxed">
                  This personalized assessment will reveal your unique entrepreneurial style and help you connect with like-minded founders. 
                  Answer about {questionsBank.recommended_min_questions || 10}–{questionsBank.recommended_max_questions || 18} questions, and we'll craft your profile.
                </p>
                <div className="bg-teal-blue/10 border border-teal-blue/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">🎁</span>
                    <span className="text-soft-white font-medium">Complete & Earn</span>
                  </div>
                  <p className="text-soft-white/70 text-sm">
                    Upon completion, you'll receive a welcome gift of NEYXT tokens to help you get started connecting 
                    with other entrepreneurs in our community. These tokens power introductions, collaborations, and 
                    meaningful connections—not transactions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Progress indicator for ongoing assessment */}
        {!existingProfile && !isLoadingProfile && answers.length > 0 && (
          <p className="text-soft-white/70 text-sm mb-6">
            Assessment in progress... We stop early when confidence reaches 90%.
          </p>
        )}

        {/* Existing Profile Display */}
        {isLoadingProfile && (
          <div className="bg-charcoal-black border border-teal-blue/30 rounded-lg p-4 mb-6">
            <div className="text-soft-white/80 text-sm">Loading your existing profile...</div>
          </div>
        )}
        
        {existingProfile && !isLoadingProfile && (
          <div className="bg-charcoal-black border border-teal-blue/30 rounded-lg p-4 mb-6">
            <h3 className="text-soft-white text-lg font-semibold mb-2">Your Current Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-gray/30 border border-teal-blue/20 rounded p-3">
                <div className="text-soft-white/70 text-xs mb-1">Profile Name</div>
                <div className="text-soft-white text-sm font-medium">{existingProfile.profileName}</div>
              </div>
              <div className="bg-slate-gray/30 border border-teal-blue/20 rounded p-3">
                <div className="text-soft-white/70 text-xs mb-1">Profile Type</div>
                <div className="text-soft-white text-sm font-medium">{existingProfile.profileType}</div>
              </div>
              <div className="bg-slate-gray/30 border border-teal-blue/20 rounded p-3">
                <div className="text-soft-white/70 text-xs mb-1">Confidence</div>
                <div className="text-soft-white text-sm font-medium">{(existingProfile.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => {
                  setExistingProfile(null);
                  reset();
                }} 
                variant="outline" 
                size="sm"
              >
                Retake Profiler
              </Button>
            </div>
          </div>
        )}

        {/* Progress */}
        {!existingProfile && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="text-soft-white/80 text-sm">Questions answered: {progress.count}</div>
              <div className="text-soft-white/60 text-sm">Building your profile...</div>
            </div>

            {/* Question Card or Result */}
            {!shouldStop && nextQuestion && (
          <div className="bg-charcoal-black border border-teal-blue/30 rounded-lg p-5 mb-6">
            <div className="text-soft-white/80 text-xs mb-2">Dimension: {profilesConfig.dimensions.find(d => d.key === nextQuestion.dimension)?.label}</div>
            <h2 className="text-lg font-semibold text-soft-white mb-4">{nextQuestion.prompt}</h2>
            <div className="space-y-2">
              {nextQuestion.options.map((opt) => (
                <Button
                  key={opt.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnswer(nextQuestion, opt.value)}
                  className="w-full justify-start text-left"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Free-text + LLM mapping */}
            <div className="mt-4 space-y-2">
              {!waitingClarification ? (
                <input
                  type="text"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Type your answer in your own words (optional)"
                  className="w-full px-3 py-2 bg-charcoal-black border border-teal-blue/20 rounded text-soft-white placeholder-soft-white/40 focus:outline-none focus:ring-2 focus:ring-princeton-orange focus:border-transparent"
                />
              ) : (
                <input
                  type="text"
                  value={clarifyPrompt}
                  onChange={(e) => setClarifyPrompt(e.target.value)}
                  placeholder="Answer the clarifying question..."
                  className="w-full px-3 py-2 bg-charcoal-black border border-teal-blue/20 rounded text-soft-white placeholder-soft-white/40 focus:outline-none focus:ring-2 focus:ring-princeton-orange focus:border-transparent"
                />
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => mapWithLLM(nextQuestion)}
                  disabled={isMapping || (!freeText && !waitingClarification)}
                >
                  {isMapping ? 'Mapping...' : waitingClarification ? 'Submit Clarification' : 'Map with AI'}
                </Button>
                {llmError && <span className="text-xs text-princeton-orange">{llmError}</span>}
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                disabled={questionHistory.length === 0}
                className="text-soft-white/60 hover:text-soft-white disabled:opacity-30"
              >
                ← Previous Question
              </Button>
              <div className="text-soft-white/40 text-xs">
                {progress.count} of ~{progress.maxQ} questions
              </div>
            </div>
          </div>
        )}

        {(shouldStop || !nextQuestion) && (
          <div className="bg-charcoal-black border border-teal-blue/30 rounded-lg p-5">
            <h3 className="text-soft-white text-xl font-semibold mb-4">Your Entrepreneurial Profile</h3>
            
            {!finalNarrative ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-princeton-orange mb-4"></div>
                <p className="text-soft-white/80 text-center">
                  Crafting your personalized profile...
                </p>
              </div>
            ) : (
              <>
                <div className="bg-slate-gray/20 border border-teal-blue/20 rounded p-4 mb-4">
                  <div className="text-soft-white/90 text-base leading-relaxed whitespace-pre-wrap">{finalNarrative}</div>
                </div>
                
                {/* Airdrop status display */}
                {airdropEnabled && (
                  <div className="bg-gradient-to-r from-princeton-orange/10 to-teal-blue/10 border border-princeton-orange/20 rounded-lg p-4 mb-4">
                    {airdropStatus === 'processing' || (isAirdropProcessing && airdropStatus === 'none') ? (
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-princeton-orange"></div>
                          <span className="text-soft-white font-semibold">Processing Your Welcome Gift...</span>
                        </div>
                        <p className="text-soft-white/80 text-sm">
                          We're sending your NEYXT tokens to your wallet. This may take a moment to complete.
                        </p>
                      </>
                    ) : airdropStatus === 'success' || airdropClaim?.status === 'completed' ? (
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">🎉</span>
                          <span className="text-soft-white font-semibold">Welcome Gift Delivered!</span>
                        </div>
                        <p className="text-soft-white/80 text-sm mb-2">
                          Congratulations! Your NEYXT tokens have been sent to your wallet and are ready to use for connecting with other entrepreneurs in our community.
                        </p>
                        {airdropClaim?.transactionHash && (
                          <p className="text-soft-white/60 text-xs">
                            💫 Transaction: {airdropClaim.transactionHash.substring(0, 10)}...{airdropClaim.transactionHash.substring(-8)}
                          </p>
                        )}
                      </>
                    ) : airdropStatus === 'error' || airdropClaim?.status === 'failed' ? (
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">⚠️</span>
                          <span className="text-soft-white font-semibold">Gift Processing Issue</span>
                        </div>
                        <p className="text-soft-white/80 text-sm mb-2">
                          There was an issue processing your welcome gift. Don't worry - your profile is saved and our team will resolve this shortly.
                        </p>
                        <p className="text-soft-white/60 text-xs">
                          💫 Contact support if you don't receive your tokens within 24 hours.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">🎁</span>
                          <span className="text-soft-white font-semibold">Welcome Gift Unlocked!</span>
                        </div>
                        <p className="text-soft-white/80 text-sm mb-2">
                          Congratulations on completing your entrepreneurial profile! You've earned a welcome gift of NEYXT tokens 
                          to start building connections with other founders in our community.
                        </p>
                        <p className="text-soft-white/60 text-xs">
                          💫 These tokens will be available in your wallet shortly and can be used to facilitate introductions and collaborations with fellow entrepreneurs.
                        </p>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Button onClick={reset} variant="outline">Take Assessment Again</Button>
                </div>
              </>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default FounderProfiler;


