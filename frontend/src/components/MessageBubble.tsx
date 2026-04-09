"use client";

import { Message, Route } from "@/lib/types";
import { LoadingSpinner } from "./LoadingSpinner";
import { Bot, User, Globe, Database, Brain } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isLoading?: boolean;
}

const ROUTE_CONFIG: Record<
  Route,
  { label: string; color: string; bg: string; Icon: React.ElementType }
> = {
  index: {
    label: "Documents",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    Icon: Database,
  },
  search: {
    label: "Web Search",
    color: "text-sky-400",
    bg: "bg-sky-400/10 border-sky-400/20",
    Icon: Globe,
  },
  general: {
    label: "General AI",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
    Icon: Brain,
  },
};

function RouteBadge({ route }: { route: Route }) {
  const cfg = ROUTE_CONFIG[route];
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(?!<[hupbla])(.+)$/, "<p>$1</p>");
}

export function MessageBubble({ message, isLoading }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="flex items-end gap-2.5 max-w-[75%]">
          <div className="bg-brand-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center">
            <User size={14} className="text-brand-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-slide-up">
      <div className="flex items-end gap-2.5 max-w-[80%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-700 border border-surface-600 flex items-center justify-center">
          <Bot size={14} className="text-brand-400" />
        </div>
        <div className="space-y-2">
          {/* Route badge */}
          {message.route && !isLoading && (
            <div className="flex items-center gap-2 mb-1">
              <RouteBadge route={message.route} />
              {message.sources && message.sources.length > 0 && (
                <span className="text-xs text-gray-500">
                  {message.sources.length} source
                  {message.sources.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg ${
              message.isError
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-surface-800 border border-surface-700"
            }`}
          >
            {isLoading ? (
              <LoadingSpinner />
            ) : message.isError ? (
              <p className="text-sm text-red-400 leading-relaxed">
                {message.content}
              </p>
            ) : (
              <div
                className="prose-ai text-sm"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(message.content),
                }}
              />
            )}
          </div>

          {/* Sources */}
          {!isLoading &&
            message.sources &&
            message.sources.length > 0 &&
            message.route !== "general" && (
              <div className="space-y-1.5 mt-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Sources
                </p>
                {message.sources.slice(0, 3).map((src, i) => (
                  <div
                    key={i}
                    className="text-xs bg-surface-850 border border-surface-700 rounded-lg px-3 py-2"
                  >
                    <p className="text-brand-400 font-medium truncate">
                      {src.title || src.source}
                    </p>
                    {src.content && (
                      <p className="text-gray-500 mt-0.5 line-clamp-2">
                        {src.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
