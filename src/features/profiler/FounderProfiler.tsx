import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import profilesConfig from '../../../knowledge/FounderProfiler/profiles_config.json';
import questionsBank from '../../../knowledge/FounderProfiler/questions_bank.json';
import { mapFreeTextToScale, summarizeResult, type LLMMapResponse } from '../../services/profilerLLM';
import { saveProfilerResult, getProfilerResult, type ProfilerResult } from '../../services/profilerService';
import { useSupabaseUser } from '../../hooks/useSupabaseUser';

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
    } catch (e) {
      setLlmError('AI mapping failed. You can select an option or try again.');
    } finally {
      setIsMapping(false);
    }
  };

  const reset = () => {
    setDimState(initialDims);
    setAnswers([]);
    setExistingProfile(null);
    setFinalNarrative('');
  };



  return (
    <div className="min-h-screen bg-slate-gray/20">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-soft-white mb-2">Founder Profiler (Adaptive)</h1>
        <p className="text-soft-white/70 text-sm mb-6">Answer about {questionsBank.recommended_min_questions || 10}–{questionsBank.recommended_max_questions || 18} questions. We stop early if confidence ≥ 90%.</p>

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
              <div className="text-soft-white/80 text-sm">Top profile confidence: {(topProfile[1] * 100).toFixed(0)}%</div>
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
          </div>
        )}

        {(shouldStop || !nextQuestion) && (
          <div className="bg-charcoal-black border border-teal-blue/30 rounded-lg p-5">
            <h3 className="text-soft-white text-xl font-semibold mb-2">Your preliminary profile</h3>
            <p className="text-soft-white/80 mb-4">
              {topProfile[0] ? `${topProfile[0]} — ${(topProfile[1] * 100).toFixed(0)}% confidence` : 'Not enough data'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {profilesConfig.dimensions.map((d) => (
                <div key={d.key} className="bg-slate-gray/30 border border-teal-blue/20 rounded p-3">
                  <div className="text-soft-white/70 text-xs mb-1">{d.label}</div>
                  <div className="text-soft-white text-sm">{dimState[d.key as DimensionKey].mean.toFixed(2)} ({d.desc})</div>
                </div>
              ))}
            </div>

            {finalNarrative && (
              <div className="bg-slate-gray/20 border border-teal-blue/20 rounded p-4 mb-3">
                <div className="text-soft-white/80 text-sm whitespace-pre-wrap">{finalNarrative}</div>
              </div>
            )}



            <div className="flex items-center space-x-2">
              <Button onClick={reset} variant="outline">Restart</Button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default FounderProfiler;


