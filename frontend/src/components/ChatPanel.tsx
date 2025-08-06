"use client";

import React, { useState, useRef, useEffect } from "react";
import { Message } from "@/types";
import { Send, X, MessageSquare } from "lucide-react";

interface ChatPanelProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  currentUserName?: string;
  className?: string;
}

export function ChatPanel({
  messages,
  isOpen,
  onClose,
  onSendMessage,
  currentUserName,
  className = "",
}: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isOwnMessage = (message: Message): boolean => {
    return message.sender.name === currentUserName;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header - More compact */}
      <div className="bg-gray-700/80 px-4 py-3 border-b border-gray-600/50 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500/30 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white text-sm">Chat</h3>
            <span className="bg-blue-500/20 px-2 py-0.5 rounded-full text-xs text-blue-300">
              {messages.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-600/50 rounded-lg transition-all duration-200 group"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-800/60">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium text-sm">No messages yet</p>
            <p className="text-gray-500 text-xs mt-1">Start a conversation</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = isOwnMessage(message);
            return (
              <div
                key={message.id}
                className={`flex ${
                  isCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`
                    max-w-[80%] group
                    ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                        : "bg-gray-700/80 text-white border border-gray-600/50"
                    }
                    rounded-lg px-3 py-2 shadow-sm transition-all duration-200
                  `}
                >
                  {/* Sender name for non-current users */}
                  {!isCurrentUser && (
                    <div className="text-xs text-gray-300 mb-1 font-medium">
                      {message.sender.name}
                    </div>
                  )}

                  {/* Message content */}
                  <div className="text-xs leading-relaxed break-words">
                    {message.text}
                  </div>

                  {/* Timestamp */}
                  <div
                    className={`
                      text-xs mt-1 opacity-70 
                      ${isCurrentUser ? "text-blue-100" : "text-gray-400"}
                    `}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form - More compact */}
      <div className="p-3 bg-gray-700/80 border-t border-gray-600/50">
        <div className="space-y-2">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="
                w-full px-3 py-2 bg-gray-600/50 text-sm
                border border-gray-500/50 rounded-lg text-white placeholder-gray-400
                focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50
                transition-all duration-200
              "
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">{newMessage.length}/500</div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="
                flex items-center gap-1 px-3 py-1.5 
                bg-gradient-to-r from-blue-500 to-blue-600 
                hover:from-blue-600 hover:to-blue-700
                disabled:from-gray-600 disabled:to-gray-700
                disabled:cursor-not-allowed disabled:opacity-50
                text-white font-medium rounded-lg text-xs
                transition-all duration-200 hover:scale-105 active:scale-95
                shadow-sm hover:shadow-md
              "
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
