'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const chatState = useChat({
    api: '/api/chat',
  });
  
  const { messages = [], sendMessage, status = 'ready' } = chatState || {};
  const isLoading = status !== 'ready';
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (sendMessage) {
      sendMessage({ content: input, role: 'user' });
    }
    setInput('');
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ backdropFilter: 'blur(20px)' }}
            className="liquid-glass rounded-3xl w-[340px] sm:w-[380px] h-[500px] mb-4 flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-black/60"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-2">
                <div className="bg-accent/20 p-2 rounded-full text-accent">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-display text-text-primary text-lg leading-tight tracking-tight">AstroBot</h3>
                  <p className="font-body text-xs text-accent">Powered by Groq AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-text-primary transition-colors p-1"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 font-body text-sm custom-scrollbar bg-black/20">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted space-y-3 opacity-70">
                  <Bot size={40} className="mb-2" />
                  <p>Hi, I'm AstroBot.</p>
                  <p className="text-xs">Ask me anything about the universe, stars, or planets!</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div 
                    key={m.id} 
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-4 rounded-2xl leading-relaxed shadow-sm
                        ${m.role === 'user' 
                          ? 'bg-white/20 text-white rounded-tr-sm border border-white/10' 
                          : 'bg-white/10 text-text-primary rounded-tl-sm border border-white/5'
                        }`}
                    >
                      <ReactMarkdown
                        components={{
                          strong: ({node, ...props}) => <strong className="font-display font-medium text-white tracking-wide" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-1 my-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-5 space-y-1 my-2" {...props} />,
                          h1: ({node, ...props}) => <h1 className="font-display text-xl text-white mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="font-display text-lg text-white mb-2 mt-3" {...props} />,
                          h3: ({node, ...props}) => <h3 className="font-display text-base text-white mb-1 mt-2" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1" {...props} />
                        }}
                      >
                        {m.content || (m.parts && m.parts.map((p: any) => p.type === 'text' ? p.text : '').join('')) || ''}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-4 rounded-2xl bg-white/10 text-text-primary rounded-tl-sm border border-white/5 flex gap-1 items-center h-10">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/20 backdrop-blur-md border-t border-white/10">
              <form 
                onSubmit={handleSubmit}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input || ''}
                  onChange={handleInputChange}
                  placeholder="Ask about the cosmos..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input?.trim()}
                  className="absolute right-2 p-2 bg-accent/20 hover:bg-accent/40 text-accent rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-accent/20"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full liquid-glass bg-black/40 hover:bg-black/60 text-text-primary shadow-2xl flex items-center justify-center transition-all relative"
        aria-label="Toggle AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Bot size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
