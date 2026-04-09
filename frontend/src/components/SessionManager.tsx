"use client";

import { Plus, Trash2, MessageSquare } from "lucide-react";

interface SessionManagerProps {
  sessionId: string;
  messageCount: number;
  onNewChat: () => void;
  onClearHistory: () => void;
  isClearing: boolean;
}

export function SessionManager({
  sessionId,
  messageCount,
  onNewChat,
  onClearHistory,
  isClearing,
}: SessionManagerProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-800 bg-surface-900">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <MessageSquare size={13} className="text-gray-500 flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate font-mono">
          {sessionId.slice(0, 8)}...
        </span>
        {messageCount > 0 && (
          <span className="text-xs text-gray-600">
            · {messageCount} message{messageCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {messageCount > 0 && (
          <button
            onClick={onClearHistory}
            disabled={isClearing}
            title="Clear chat history"
            className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
          >
            <Trash2 size={13} />
          </button>
        )}
        <button
          onClick={onNewChat}
          title="New chat"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-surface-700 transition-colors"
        >
          <Plus size={13} />
          New chat
        </button>
      </div>
    </div>
  );
}
