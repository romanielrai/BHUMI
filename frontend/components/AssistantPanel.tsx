'use client';
/* eslint-disable no-undef, no-unused-vars */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Volume2, VolumeX, RotateCcw, Bot, User } from 'lucide-react';

/* ── Types ─────────────────────────────────────── */
interface Message {
  role: 'assistant' | 'user';
  text: string;
  id: string;
}

/* ── Web Speech API type shims ──────────────────── */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/* ── Animated waveform bar ──────────────────────── */
function WaveBar({ active, delay }: { active: boolean; delay: number }) {
  return (
    <motion.div
      className="w-0.5 rounded-full bg-gold"
      animate={active ? { height: ['4px', '20px', '8px', '16px', '4px'] } : { height: '4px' }}
      transition={active ? { duration: 1.0, delay, repeat: Infinity, ease: 'easeInOut' } : {}}
    />
  );
}

const SESSION_ID = `session-${Date.now()}`;
const INITIAL: Message = {
  role: 'assistant',
  text: "Hello! I'm your AI growth specialist from AI Growth Systems. I can help you with pricing, services, booking a consultation, or answering any questions about our AI receptionist and automation platform. How can I help you today?",
  id: 'init',
};

export default function AssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcript, setTranscript] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  /* ── Check browser voice support + preload voices ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);

    // Voices load asynchronously — preload and cache them
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis?.getVoices() ?? [];
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  /* ── Auto-scroll to bottom ── */
  useEffect(() => {
    if (messages.length > 1 || loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  /* ── Speak response ── */
  const speak = useCallback((rawText: string) => {
    if (!speakEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip markdown and symbols so they don't get read aloud
    const cleaned = rawText
      .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold**
      .replace(/\*(.*?)\*/g, '$1')        // *italic*
      .replace(/•/g, ',')                 // bullet → pause
      .replace(/✓/g, '')                  // checkmark
      .replace(/→/g, 'to')               // arrow
      .replace(/[#_`~]/g, '')             // other markdown
      .replace(/\n{2,}/g, '. ')           // double newlines → sentence pause
      .replace(/\n/g, ', ')               // single newlines → comma pause
      .replace(/\.{2,}/g, '.')            // multiple dots
      .replace(/\s{2,}/g, ' ')            // extra spaces
      .trim();

    const utt = new SpeechSynthesisUtterance(cleaned);
    utt.rate   = 0.88;   // slightly slower — easier to follow
    utt.pitch  = 0.95;   // slightly lower — warmer, more natural
    utt.volume = 1.0;

    // Priority voice list — most natural English voices
    const priorityNames = [
      'Google UK English Female',
      'Google US English',
      'Samantha',           // macOS
      'Karen',              // macOS Australian
      'Moira',              // macOS Irish
      'Microsoft Aria Online (Natural)',
      'Microsoft Jenny Online (Natural)',
      'Google UK English Male',
    ];

    const voices = voicesRef.current.length
      ? voicesRef.current
      : (window.speechSynthesis.getVoices() ?? []);

    const preferred =
      priorityNames.reduce<SpeechSynthesisVoice | null>((found, name) => {
        if (found) return found;
        return voices.find(v => v.name === name) ?? null;
      }, null)
      ?? voices.find(v => v.lang === 'en-GB' && !v.localService)
      ?? voices.find(v => v.lang === 'en-US' && !v.localService)
      ?? voices.find(v => v.lang.startsWith('en'));

    if (preferred) utt.voice = preferred;

    window.speechSynthesis.speak(utt);
  }, [speakEnabled]);

  /* ── Send message to API ── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: text.trim(), id: `u-${Date.now()}` };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setTranscript('');
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          messages: next.map(m => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      const reply = data.answer ?? "I'm here to help — could you rephrase that?";
      const assistantMsg: Message = { role: 'assistant', text: reply, id: `a-${Date.now()}` };
      setMessages(prev => [...prev, assistantMsg]);
      speak(reply);
    } catch {
      const errorMsg: Message = {
        role: 'assistant',
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        id: `err-${Date.now()}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, speak]);

  /* ── Voice input ── */
  const toggleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(interim || final);
      if (final) {
        setListening(false);
        sendMessage(final);
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  }, [listening, sendMessage]);

  /* ── Reset chat ── */
  const resetChat = () => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setMessages([INITIAL]);
    setInput('');
    setTranscript('');
    setListening(false);
  };

  const quickPrompts = [
    'What are your pricing plans?',
    'How does missed call recovery work?',
    'Book a demo for me',
    'What\'s your ROI guarantee?',
  ];

  return (
    <section id="assistant" className="scroll-mt-28 mt-24 rounded-[32px] border border-white/10 bg-glass shadow-glow overflow-hidden">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-gold">AI Assistant</p>
          <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
            Talk to our AI growth specialist.
          </h2>
          <p className="mt-1.5 text-sm text-foreground/70">
            Ask about pricing, services, book a demo, or ask anything — type or use your voice.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              title={listening ? 'Stop listening' : 'Start voice input'}
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all duration-300 ${
                listening
                  ? 'border-red-500/30 bg-red-950/20 text-red-300 hover:bg-red-950/30'
                  : 'border-gold/20 bg-gold/5 text-gold hover:bg-gold/10 hover:shadow-[0_0_16px_rgba(207,199,186,0.15)]'
              }`}
            >
              {listening ? <MicOff size={15} /> : <Mic size={15} />}
              <span>{listening ? 'Stop' : 'Voice'}</span>
              {listening && (
                <span className="flex gap-0.5 items-end ml-1">
                  {[0,0.1,0.2,0.1,0].map((d, i) => (
                    <WaveBar key={i} active={true} delay={d} />
                  ))}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setSpeakEnabled(v => !v)}
            title={speakEnabled ? 'Mute AI voice' : 'Enable AI voice'}
            className={`rounded-full border px-3 py-2.5 text-sm transition-all duration-300 ${
              speakEnabled
                ? 'border-white/10 bg-white/5 text-foreground hover:bg-white/10'
                : 'border-white/5 bg-white/3 text-white/30'
            }`}
          >
            {speakEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <button
            onClick={resetChat}
            title="Reset conversation"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground transition hover:bg-white/10"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
        {/* ── Chat window ── */}
        <div className="flex flex-col border-r border-white/10">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[340px] max-h-[420px]">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    msg.role === 'assistant' ? 'bg-gold/10 text-gold' : 'bg-white/10 text-white'
                  }`}>
                    {msg.role === 'assistant' ? <Bot size={15} /> : <User size={15} />}
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-[#08122e] border border-white/8 text-foreground/90 rounded-tl-sm'
                      : 'bg-gold/10 border border-gold/20 text-white rounded-tr-sm'
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
                    <Bot size={15} />
                  </div>
                  <div className="bg-[#08122e] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-gold/60"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                        transition={{ duration: 0.9, delay: d, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Voice transcript preview */}
          <AnimatePresence>
            {(listening || transcript) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/10 bg-red-950/10 px-5 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                  </span>
                  <p className="text-xs text-white/70">
                    {listening ? (transcript || 'Listening… speak now') : transcript}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input bar */}
          <div className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(input); }}
                placeholder="Type a message or click Voice…"
                disabled={loading || listening}
                className="flex-1 rounded-2xl border border-white/10 bg-[#0c1433] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center rounded-full bg-gold px-4 py-3 text-background transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_20px_rgba(207,199,186,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right sidebar: Quick prompts + waveform ── */}
        <div className="flex flex-col gap-4 p-5 bg-[#06101f]/50">
          {/* Voice waveform display */}
          <div className="rounded-2xl border border-white/8 bg-[#040a1e] px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Voice agent</p>
              <span className={`text-xs ${loading ? 'text-gold animate-pulse' : 'text-white/30'}`}>
                {loading ? 'Processing…' : listening ? 'Listening…' : 'Ready'}
              </span>
            </div>
            <div className="flex h-10 items-end justify-between gap-0.5">
              {Array.from({ length: 24 }).map((_, i) => (
                <WaveBar key={i} active={loading || listening} delay={i * 0.04} />
              ))}
            </div>
          </div>

          {/* Quick prompts */}
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">Quick prompts</p>
            <div className="space-y-2">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-left text-xs text-foreground/80 transition-all duration-200 hover:border-gold/20 hover:bg-gold/5 hover:text-gold disabled:opacity-40"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Company context note */}
          <div className="mt-auto rounded-2xl border border-gold/10 bg-gold/5 p-4">
            <p className="text-xs font-semibold text-gold mb-1">Company Script Active</p>
            <p className="text-xs text-foreground/60 leading-relaxed">
              This AI responds as an AI Growth Systems consultant — pricing, services, objection handling, and bookings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
