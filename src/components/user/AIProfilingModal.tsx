import { useEffect, useRef, useState } from 'react';
import { X, Send, Bot, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import config from '../../config/env';

type ChatRole = 'system' | 'user' | 'assistant' | 'developer' | 'tool';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface AIProfilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt?: string;
}

export const AIProfilingModal = ({ isOpen, onClose, systemPrompt = 'You are a helpful onboarding assistant for founders.' }: AIProfilingModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: systemPrompt },
    { role: 'assistant', content: 'Hi! I\'m your AI assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // scroll to bottom on open and on new messages
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [isOpen, messages.length]);

  if (!isOpen) return null;

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const nextMessages = [...messages, { role: 'user' as ChatRole, content: input.trim() }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      // Use centralized config that auto-detects environment
      const baseUrl = config.ai.useSupabase ? config.ai.supabaseEdgeUrl : config.ai.fallbackApiUrl;
      const useSupabase = config.ai.useSupabase;

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(useSupabase ? { Authorization: `Bearer ${config.supabase.anonKey}` } : {}),
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          model: 'gpt-4o-mini',
          temperature: 0.2,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Request failed');
      }
      const data = (await res.json()) as { content?: string };
      const reply = (data.content || '').trim();
      setMessages((prev) => [...prev, { role: 'assistant', content: reply || '...' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not reach the AI service.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-charcoal-black border border-teal-blue/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-gray rounded-t-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-princeton-orange" />
            <h2 className="text-soft-white font-semibold text-lg">AI Profiling (ChatGPT)</h2>
          </div>
          <button onClick={onClose} className="text-soft-white/60 hover:text-soft-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={viewportRef} className="p-4 space-y-3 overflow-y-auto flex-1">
          {messages
            .filter((m) => m.role !== 'system')
            .map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed border ${
                    m.role === 'user'
                      ? 'bg-princeton-orange text-soft-white border-princeton-orange/60'
                      : 'bg-slate-gray/40 text-soft-white border-teal-blue/20'
                  }`}
                >
                  <div className="flex items-center mb-1 opacity-80 text-xs">
                    {m.role === 'user' ? (
                      <>
                        <UserIcon className="w-3 h-3 mr-1" /> You
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 mr-1" /> Assistant
                      </>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-teal-blue/20">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-charcoal-black border border-teal-blue/20 rounded text-soft-white placeholder-soft-white/40 focus:outline-none focus:ring-2 focus:ring-princeton-orange focus:border-transparent"
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()} className="px-4">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-soft-white/50 mt-2">Testing ChatGPT API connectivity via serverless proxy.</p>
        </div>
      </div>
    </div>
  );
};

export default AIProfilingModal;


