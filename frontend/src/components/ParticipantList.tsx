"use client";

import React from "react";
import { Participant } from "@/types";
import { Mic, MicOff, Video, VideoOff, Monitor, Crown } from "lucide-react";

interface ParticipantListProps {
  participants: Participant[];
  currentUserId?: string;
  className?: string;
}

export function ParticipantList({
  participants,
  currentUserId,
  className = "",
}: ParticipantListProps) {
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isCurrentUser = (participant: Participant): boolean => {
    return participant.userId === currentUserId;
  };

  return (
    <div className={`bg-gray-800 p-4 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">
          Participants ({participants.length})
        </h3>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {participants.map((participant) => (
            <div
              key={participant.socketId}
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center text-xs font-semibold">
                    {getInitials(participant.name)}
                  </div>

                  {/* Host indicator */}
                  {isCurrentUser(participant) && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                      <Crown size={8} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Participant info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {participant.name}
                    {isCurrentUser(participant) && (
                      <span className="text-xs text-purple-200 ml-1">
                        (You)
                      </span>
                    )}
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center gap-1 mt-1">
                    {/* Audio status */}
                    <div
                      className={`p-0.5 rounded ${
                        participant.isAudioOn ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {participant.isAudioOn ? (
                        <Mic size={8} className="text-white" />
                      ) : (
                        <MicOff size={8} className="text-white" />
                      )}
                    </div>

                    {/* Video status */}
                    <div
                      className={`p-0.5 rounded ${
                        participant.isVideoOn ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {participant.isVideoOn ? (
                        <Video size={8} className="text-white" />
                      ) : (
                        <VideoOff size={8} className="text-white" />
                      )}
                    </div>

                    {/* Screen sharing status */}
                    {participant.isScreenSharing && (
                      <div className="p-0.5 rounded bg-blue-500">
                        <Monitor size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add participant button (placeholder) */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
          + Invite Participants
        </button>
      </div>
    </div>
  );
}
