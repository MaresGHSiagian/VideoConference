"use client";

import React from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MessageSquare,
  Circle,
  Users,
  PhoneOff,
  Settings,
  UserPlus,
} from "lucide-react";

interface ToolbarProps {
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isInviteOpen?: boolean;
  participantCount: number;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleInvite?: () => void;
  onToggleSettings?: () => void;
  onEndCall: () => void;
  className?: string;
}

export function Toolbar({
  isVideoOn,
  isAudioOn,
  isScreenSharing,
  isChatOpen,
  isInviteOpen = false,
  participantCount,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleChat,
  onToggleInvite,
  onToggleSettings,
  onEndCall,
  className = "",
}: ToolbarProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Audio Toggle */}
      <button
        onClick={onToggleAudio}
        className={`
          group relative flex items-center justify-center w-14 h-14 rounded-2xl
          transition-all duration-300 hover:scale-105 active:scale-95
          ${
            isAudioOn
              ? "bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
              : "bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
          }
        `}
        title={isAudioOn ? "Mute" : "Unmute"}
      >
        {isAudioOn ? (
          <Mic className="w-6 h-6 text-white" />
        ) : (
          <MicOff className="w-6 h-6 text-white" />
        )}
        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {/* Video Toggle */}
      <button
        onClick={onToggleVideo}
        className={`
          group relative flex items-center justify-center w-14 h-14 rounded-2xl
          transition-all duration-300 hover:scale-105 active:scale-95
          ${
            isVideoOn
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              : "bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
          }
        `}
        title={isVideoOn ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoOn ? (
          <Video className="w-6 h-6 text-white" />
        ) : (
          <VideoOff className="w-6 h-6 text-white" />
        )}
        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {/* Screen Share Toggle */}
      <button
        onClick={onToggleScreenShare}
        className={`
          group relative flex items-center justify-center w-14 h-14 rounded-2xl
          transition-all duration-300 hover:scale-105 active:scale-95
          ${
            isScreenSharing
              ? "bg-gradient-to-r from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
              : "bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30"
          }
        `}
        title={isScreenSharing ? "Stop sharing" : "Share screen"}
      >
        <Monitor
          className={`w-6 h-6 ${
            isScreenSharing ? "text-white" : "text-gray-300"
          }`}
        />
        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-white/20"></div>

      {/* Chat Toggle */}
      <button
        onClick={onToggleChat}
        className={`
          group relative flex items-center justify-center w-14 h-14 rounded-2xl
          transition-all duration-300 hover:scale-105 active:scale-95
          ${
            isChatOpen
              ? "bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50"
              : "bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30"
          }
        `}
        title={isChatOpen ? "Close chat" : "Open chat"}
      >
        <MessageSquare
          className={`w-6 h-6 ${isChatOpen ? "text-white" : "text-gray-300"}`}
        />
        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {/* Invite Toggle */}
      {onToggleInvite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleInvite();
          }}
          className={`
            group relative flex items-center justify-center w-14 h-14 rounded-2xl
            transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer
            ${
              isInviteOpen
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                : "bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30"
            }
          `}
          title={isInviteOpen ? "Close invite" : "Invite participants"}
        >
          <UserPlus
            className={`w-6 h-6 ${
              isInviteOpen ? "text-white" : "text-gray-300"
            }`}
          />
          <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          {/* Tooltip on hover */}
          <span className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Invite others
          </span>
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-8 bg-white/20"></div>

      {/* Participants Count */}
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20">
        <Users className="w-5 h-5 text-blue-400" />
        <span className="text-white font-medium text-sm">
          {participantCount}
        </span>
      </div>

      {/* Settings */}
      <button
        onClick={onToggleSettings}
        className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 active:scale-95"
        title="Settings"
      >
        <Settings className="w-6 h-6 text-gray-300" />
        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-white/20"></div>

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
        title="End call"
      >
        <PhoneOff className="w-6 h-6 text-white" />
        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </div>
  );
}
