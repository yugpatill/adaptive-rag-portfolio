"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { SessionManager } from "./SessionManager";
import { sendQuery, clearChatHistory } from "@/lib/api";
import { Send, Bot, Zap } from "lucide-react";

interface ChatWindowProps {
  sessionId: string;
  onNewSession: () => void;
}

const SUGGESTED_QUESTIONS = [
  "What documents have I uploaded?",
  "Summarize the key points from my files",
  "What is the latest news about AI?",
  "Explain how vector databases work",
];

export function ChatWindow({ sessionId, onNewSession }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [loadingMessageId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages([]);
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function adjustTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function handleSend() {
    const query = input.trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    try {
      const response = await sendQuery(query, sessionId);
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        route: response.route,
        sources: response.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          err instanceof Error
            ? `Error: ${err.message}`
            : "Something went wrong. Please check that the backend is running and try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleClearHistory() {
    setIsClearing(true);
    try {
      await clearChatHistory(sessionId);
      setMessages([]);
    } catch {
      // silently fail — local state cleared is good enough
      setMessages([]);
    } finally {
      setIsClearing(false);
    }
  }

  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col flex-1 h-full min-w-0">
      <SessionManager
        sessionId={sessionId}
        messageCount={messages.length}
        onNewChat={onNewSession}
        onClearHistory={handleClearHistory}
        isClearing={isClearing}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mb-5">
              <Bot size={28} className="text-brand-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Adaptive RAG
            </h2>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-8">
              Ask me anything. I'll automatically route your question to the
              right source — your uploaded documents, the web, or my own
              knowledge.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    textareaRef.current?.focus();
                  }}
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 hover:border-brand-600 hover:bg-surface-750 transition-all text-left group"
                >
                  <Zap
                    size={13}
                    className="text-brand-400 mt-0.5 flex-shrink-0 group-hover:text-brand-300"
                  />
                  <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                    {q}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <MessageBubble
                key={loadingMessageId}
                message={{
                  id: loadingMessageId,
                  role: "assistant",
                  content: "",
                  timestamp: new Date(),
                }}
                isLoading
              />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-surface-800 bg-surface-950">
        <div className="relative flex items-end gap-2 bg-surface-800 border border-surface-700 rounded-2xl px-4 py-3 focus-within:border-brand-600 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… (Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-600 resize-none outline-none leading-relaxed"
            style={{ maxHeight: "160px" }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">
          Powered by Ollama · llama3.2 · LangGraph
        </p>
      </div>
    </div>
  );
}
