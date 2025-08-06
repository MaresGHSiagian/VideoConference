"use client";

import React, { useEffect } from "react";
import { VideoTile } from "./VideoTile";
import { Participant } from "@/types";
import { webRTCService } from "@/services/webRTCService";

interface VideoGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  currentUserId?: string;
  className?: string;
}

export function VideoGrid({
  participants,
  localStream,
  currentUserId,
  className = "",
}: VideoGridProps) {
  // Debug: Log stream status
  useEffect(() => {
    console.log('VideoGrid state:', {
      participantCount: participants.length,
      hasLocalStream: !!localStream,
      localStreamVideoTracks: localStream?.getVideoTracks().length || 0,
      localStreamVideoEnabled: localStream?.getVideoTracks()[0]?.enabled,
    });
  }, [participants, localStream]);

  // Get current user participant
  const currentUser = participants.find((p) => p.userId === currentUserId);

  // Get other participants (excluding current user)
  const otherParticipants = participants.filter(
    (p) => p.userId !== currentUserId
  );

  // Support up to 9 participants in main grid (3x3)
  const displayedParticipants = otherParticipants.slice(0, 8); // 8 others + 1 current user = 9 total
  const remainingParticipants = otherParticipants.slice(8); // Additional participants

  // Get grid layout classes based on participant count
  const getGridClasses = (count: number): string => {
    if (count === 1) return "grid-cols-1 grid-rows-1";
    if (count === 2) return "grid-cols-2 grid-rows-1";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    if (count <= 6) return "grid-cols-3 grid-rows-2";
    if (count <= 9) return "grid-cols-3 grid-rows-3";
    return "grid-cols-3 grid-rows-3"; // Default to 3x3
  };

  const totalDisplayed = displayedParticipants.length + (currentUser ? 1 : 0);
  const gridClasses = getGridClasses(totalDisplayed);

  return (
    <div className={`${className}`}>
      {/* Main video grid */}
      <div className={`grid ${gridClasses} gap-4 h-full`}>
        {/* Current user video (local stream) */}
        {currentUser && (
          <VideoTile
            key={`local-${currentUser.socketId}`}
            participant={currentUser}
            stream={localStream || undefined}
            isLocal={true}
            className="min-h-[200px]"
          />
        )}

        {/* Other participants */}
        {displayedParticipants.map((participant) => {
          const connection = webRTCService.getConnection(participant.socketId);
          return (
            <VideoTile
              key={participant.socketId}
              participant={participant}
              stream={connection?.stream}
              isLocal={false}
              className="min-h-[200px]"
            />
          );
        })}
      </div>

      {/* Additional participants list */}
      {remainingParticipants.length > 0 && (
        <div className="mt-4">
          <div className="text-gray-600 text-sm mb-2 px-2">
            More participants ({remainingParticipants.length}):
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {remainingParticipants.map((participant) => {
              const connection = webRTCService.getConnection(
                participant.socketId
              );
              return (
                <div key={participant.socketId} className="flex-shrink-0">
                  <VideoTile
                    participant={participant}
                    stream={connection?.stream}
                    isLocal={false}
                    className="w-32 h-24"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overflow indicator */}
      {otherParticipants.length > 8 && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">
            Total: {participants.length} participants in meeting
          </div>
        </div>
      )}
    </div>
  );
}
