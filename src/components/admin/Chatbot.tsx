import { useState, useRef, useEffect } from 'react';
import type { ModelMessage } from "ai";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Sparkles } from "lucide-react";

// ModelMessage = {
//   role: 'user' | 'assistant',
//   content: string | object
// }

export default function Chatbot() {
  const [messages, setMessages] = useState<Array<ModelMessage>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    // Agregar mensaje del usuario
    const userMessage: ModelMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.text(); // ← Recibe texto plano

      console.log('Respuesta del servidor:', data); // ← Verifica el contenido recibido

      // Agregar respuesta del asistente
      const assistantMessage: ModelMessage = { role: 'assistant', content: data };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error al conectar con el servidor'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"

        >
          <MessageCircle className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-12" />
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800/50 flex flex-col overflow-hidden"
      >
        {/* Ambient background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <SheetHeader className="relative px-8 py-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-white tracking-tight">
                AI Assistant
              </SheetTitle>
              <p className="text-sm text-slate-400 mt-0.5">
                Siempre aquí para ayudarte
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 relative">
          {messages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 px-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <MessageCircle className="h-10 w-10 text-cyan-400/60" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Comienza una conversación
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Pregunta lo que necesites. Estoy aquí para asistirte con cualquier consulta.
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${message.role === 'user'
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-800/60 text-slate-100 border border-slate-700/50 backdrop-blur-sm'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="max-w-[85%] rounded-2xl px-5 py-3.5 bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="relative px-6 py-5 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage(input);
                setInput('');
              }
            }}
            className="relative"
          >
            <div className="relative flex items-center gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-5 py-3.5 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="icon"
                className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-5 w-5 text-white" />
                <span className="sr-only">{loading ? 'Enviando...' : 'Submit'}</span>
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
