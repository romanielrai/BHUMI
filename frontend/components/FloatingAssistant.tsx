'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  text: string;
  id: string;
}

const SESSION_ID = `floating-session-${Date.now()}`;
const INITIAL_MSG = "Hello! I am your AI Growth Assistant. I can help you with packages, pricing, how to register, or missed call recovery information. How can I help you today?";

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: INITIAL_MSG, id: 'init' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Turn off notification once opened
  useEffect(() => {
    if (isOpen) {
      setShowNotification(false);
    }
  }, [isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      text: textToSend.trim(),
      id: `u-${Date.now()}`
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/chatbot/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          messages: chatHistory
        })
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      const assistantMsg: Message = {
        role: 'assistant',
        text: data.answer || "I'm here to help — could you rephrase that?",
        id: `a-${Date.now()}`
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        role: 'assistant',
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        id: `err-${Date.now()}`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'What are the pricing plans?', text: 'What are your pricing plans?' },
    { label: 'How does missed call recovery work?', text: 'How does missed call recovery work?' },
    { label: 'How do I register?', text: 'How do I register on this platform?' }
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mb-3 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[20px] border border-white/10 bg-background/95 shadow-glow backdrop-blur-xl md:w-[340px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gold/5 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <Bot size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-wide text-white">AI Growth Assistant</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-white/50 font-medium font-mono uppercase">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-white/50 hover:bg-white/5 hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex h-[380px] flex-col overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                      msg.role === 'assistant' ? 'bg-gold/10 text-gold' : 'bg-white/10 text-white'
                    }`}>
                      {msg.role === 'assistant' ? <Bot size={12} /> : <User size={12} />}
                    </div>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                      msg.role === 'assistant'
                        ? 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none'
                        : 'bg-gold/15 border border-gold/10 text-white rounded-tr-none'
                    }`}>
                      {msg.text.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
                          {line.split('**').map((part, idx) => 
                            idx % 2 === 1 ? <strong key={idx} className="font-semibold text-gold">{part}</strong> : part
                          )}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Quick prompts choice buttons inside chat content if it is welcome message & no inputs yet */}
                  {msg.id === 'init' && messages.length === 1 && (
                    <div className="ml-8 mt-2 flex flex-col gap-2">
                      {quickPrompts.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip.text)}
                          disabled={loading}
                          className="w-fit rounded-full border border-gold/30 bg-transparent px-4 py-1.5 text-left text-[10.5px] font-bold text-white transition duration-200 hover:bg-gold/5 hover:border-gold/60 disabled:opacity-40"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <Bot size={12} />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-1">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <motion.span
                        key={i}
                        className="h-1 w-1 rounded-full bg-gold/60"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                        transition={{ duration: 0.9, delay: d, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="border-t border-white/10 p-3 bg-background flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={loading}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white placeholder-white/30 outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/25 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-background hover:brightness-105 transition disabled:opacity-45"
              >
                <Send size={12} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gold text-background shadow-glow hover:scale-[1.05] transition-transform duration-300 group"
        aria-label="Toggle Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquare size={20} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing Notification Ring */}
        {showNotification && !isOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background" />
          </span>
        )}
      </button>
    </div>
  );
}
