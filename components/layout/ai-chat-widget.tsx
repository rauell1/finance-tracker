"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatWidgetProps {
  sandboxContext?: {
    accounts: any[];
    budgets: any[];
    transactions: any[];
  };
}

export function AIChatWidget({ sandboxContext }: AIChatWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I am your FinTrack Assistant. Ask me anything about how FinTrack works, setting up M-Pesa SMS sync, or managing your budgets!"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, sandboxContext }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I am having trouble connecting right now. Please try again in a moment."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-[9999] font-sans lg:bottom-6 lg:right-6">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white flex items-center justify-center shadow-lg shadow-[#EA580C]/25 hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="h-[min(500px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-[380px] bg-white rounded-3xl border border-[#DCFCE7] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-[#EA580C] p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight">FinTrack Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white/80 font-semibold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              aria-label="Close assistant"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#FEF9C3]/10 to-transparent">
            {messages.map((msg, i) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[82%] text-xs leading-relaxed p-3 rounded-2xl",
                    isAssistant
                      ? "bg-secondary text-foreground rounded-tl-sm self-start border border-[#DCFCE7]/60"
                      : "bg-[#EA580C] text-white rounded-tr-sm self-end ml-auto shadow-sm"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs bg-secondary p-3 rounded-2xl rounded-tl-sm self-start border border-[#DCFCE7]/60 max-w-[82%]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#EA580C]" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-[#DCFCE7] bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="flex-1 h-10 px-3.5 text-xs bg-secondary rounded-xl border border-[#DCFCE7]/50 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] disabled:opacity-50 text-foreground"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white flex items-center justify-center shrink-0 disabled:opacity-30 disabled:hover:bg-[#EA580C] transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
