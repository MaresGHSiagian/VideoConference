"use client";

import { MeetingRoom } from "@/components/MeetingRoom";
import { BrowserCompatibilityCheck } from "@/components/BrowserCompatibilityCheck";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function MeetingPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { isLoading } = useAuth();

  // Don't render anything while auth is loading to prevent redirect flashing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserCompatibilityCheck>
      <MeetingRoom roomId={roomId} />
    </BrowserCompatibilityCheck>
  );
}
