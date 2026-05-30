'use client';

import { useState } from 'react';
import { Send, Mic, AudioWaveform } from 'lucide-react';

const initialMessages = [
  { role: 'assistant', text: 'Hello — I’m your AI growth specialist. What would you like to achieve today?' }
];

export default function AssistantPanel() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!input.trim()) return;
    const nextMessages = [...messages, { role: 'user', text: input }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'demo-session', messages: nextMessages })
      });
      const data = await response.json();
      setMessages((current) => [...current, { role: 'assistant', text: data.answer ?? 'I’m here to help.' }]);
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: 'There was a problem connecting to our AI assistant.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="assistant" className="mt-24 rounded-[32px] border border-white/10 bg-glass p-8 shadow-glow">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-gold">AI Assistant</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Voice agent simulation with chat intelligence.</h2>
          <p className="mt-4 text-foreground/80">
            Ask about pricing, services, guarantees, or schedule a consultation and watch the assistant respond with lead qualification and booking intent.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[#07102e] px-5 py-4">
          <div className="rounded-full bg-gold/15 p-3 text-gold">
            <Mic size={18} />
          </div>
          <div>
            <p className="text-sm text-foreground/80">Talk button</p>
            <p className="text-sm text-white">Voice input enabled soon</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#08102f]/95 p-6">
          <div className="flex items-center justify-between text-foreground/80">
            <span>Live call simulation</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs">Multi-language ready</span>
          </div>
          <div className="h-40 overflow-y-auto rounded-[24px] border border-white/10 bg-[#0d1738] p-4 text-sm text-foreground/80">
            {messages.map((message, index) => (
              <div key={index} className="mb-4">
                <p className={`text-xs uppercase tracking-[0.24em] ${message.role === 'assistant' ? 'text-gold' : 'text-white/70'}`}>
                  {message.role}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">{message.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#08122f]/95 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-foreground/80">
              <span>Voice waveform</span>
              <AudioWaveform size={18} />
            </div>
            <div className="mt-4 h-24 rounded-[24px] bg-[#0d1738] p-4 flex items-center justify-center">
              {loading ? (
                <div className="flex items-center gap-1.5">
                  <span className="h-6 w-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="h-10 w-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="h-14 w-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.3s' }} />
                  <span className="h-10 w-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.4s' }} />
                  <span className="h-6 w-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.5s' }} />
                </div>
              ) : (
                <div className="h-1 w-full rounded-full bg-gold/20 relative">
                  <div className="absolute left-0 top-0 h-full w-full bg-gold/40 animate-pulse rounded-full" />
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Simulate voice / text prompt</label>
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit();
                  }}
                  placeholder="Ask about pricing, packages, guarantees..."
                  className="w-full rounded-2xl border border-white/10 bg-[#0c1433] px-4 py-3.5 pr-10 text-sm text-white placeholder-white/40 outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/30"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              onClick={submit}
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-background transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
            >
              <Send className="mr-2 h-4 w-4" /> Ask AI
            </button>
            <span className="text-xs text-foreground/60 leading-normal">
              Type your query above and press Enter or click the button to trigger active consultative sales simulation.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
