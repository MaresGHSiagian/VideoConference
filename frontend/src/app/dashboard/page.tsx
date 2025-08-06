"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ToastService } from "@/services/toastService";
import {
  Video,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  Clock,
  Copy,
  Plus,
  LogOut,
  User,
  ExternalLink,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface Meeting {
  id: string;
  name: string;
  room_id: string;
  created_at: string;
  participants_count: number;
  type?: "instant" | "scheduled";
  scheduled_for?: string;
  description?: string;
  status?: "upcoming" | "completed";
}

interface UserStats {
  meetingsHosted: number;
  participantsMet: number;
}

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [meetingId, setMeetingId] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [activeTab, setActiveTab] = useState("id"); // "id" or "link"
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    meetingsHosted: 0,
    participantsMet: 0,
  });
  const [personalRoomId] = useState(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (!isLoading) {
      if (!user) {
        const token = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");

        // If we have stored auth data, don't redirect immediately
        if (!token || !storedUser) {
          console.log("Dashboard: No auth data found, redirecting to login");
          router.push("/login");
        }
      } else {
        // User is authenticated, load data
        loadRecentMeetings();
        loadUserStats();

        // Set up auto-cleanup interval for expired meetings
        const cleanupInterval = setInterval(() => {
          loadRecentMeetings(); // This will automatically clean up expired meetings
        }, 60000); // Check every minute

        // Also run cleanup on page visibility change (when user comes back to tab)
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            loadRecentMeetings();
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Cleanup on component unmount
        return () => {
          clearInterval(cleanupInterval);
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
        };
      }
    }
  }, [user, isLoading, router]);

  const loadRecentMeetings = async () => {
    // Load scheduled meetings from localStorage
    try {
      const savedMeetings = localStorage.getItem("scheduledMeetings");
      const meetings = savedMeetings ? JSON.parse(savedMeetings) : [];

      // Filter to only show scheduled meetings and clean up expired ones
      const currentTime = new Date();
      const validMeetings = meetings.filter((meeting: Meeting) => {
        // Only keep scheduled meetings
        if (meeting.type !== "scheduled" || !meeting.scheduled_for) {
          return false;
        }

        // For scheduled meetings, check if they're still valid
        const scheduledTime = new Date(meeting.scheduled_for);
        const timeDifference = currentTime.getTime() - scheduledTime.getTime();

        // Keep meetings that haven't ended more than 4 hours ago
        const fourHoursInMs = 4 * 60 * 60 * 1000;
        return timeDifference < fourHoursInMs;
      });

      // Save cleaned meetings back to localStorage if any were removed
      if (validMeetings.length !== meetings.length) {
        localStorage.setItem(
          "scheduledMeetings",
          JSON.stringify(validMeetings)
        );
        console.log(
          `Cleaned up ${
            meetings.length - validMeetings.length
          } expired meetings`
        );
      }

      // Sort by scheduled time, most recent first
      const sortedMeetings = validMeetings.sort(
        (a: Meeting, b: Meeting) =>
          new Date(b.scheduled_for || b.created_at).getTime() -
          new Date(a.scheduled_for || a.created_at).getTime()
      );

      setRecentMeetings(sortedMeetings);
    } catch (error) {
      console.error("Failed to load meetings:", error);
      setRecentMeetings([]);
    }
  };

  const loadUserStats = async () => {
    try {
      const savedStats = localStorage.getItem("userStats");
      if (savedStats) {
        setUserStats(JSON.parse(savedStats));
      } else {
        // Calculate stats from scheduled meetings only
        const savedMeetings = localStorage.getItem("scheduledMeetings");
        const meetings = savedMeetings ? JSON.parse(savedMeetings) : [];
        const scheduledMeetings = meetings.filter(
          (meeting: Meeting) => meeting.type === "scheduled"
        );
        const stats = {
          meetingsHosted: scheduledMeetings.length,
          participantsMet: scheduledMeetings.length * 3, // Estimate
        };
        setUserStats(stats);
        localStorage.setItem("userStats", JSON.stringify(stats));
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      setUserStats({ meetingsHosted: 0, participantsMet: 0 });
    }
  };

  const handleNewMeeting = async () => {
    setIsActionLoading(true);
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Update stats only (don't add to recent meetings since we only show scheduled meetings)
      const currentStats = { ...userStats };
      currentStats.meetingsHosted += 1;
      setUserStats(currentStats);
      localStorage.setItem("userStats", JSON.stringify(currentStats));

      router.push(`/meeting/${roomId}`);
    } catch (error) {
      console.error("Failed to create meeting:", error);
      ToastService.error("Failed to create meeting. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleJoinMeeting = () => {
    const id =
      activeTab === "id"
        ? meetingId.trim()
        : extractMeetingIdFromLink(meetingLink.trim());

    if (id) {
      router.push(`/meeting/${id}`);
    } else {
      ToastService.error("Please enter a valid Meeting ID or Link");
    }
  };

  const extractMeetingIdFromLink = (link: string): string => {
    if (link.includes("/meeting/")) {
      return link.split("/meeting/")[1].split("?")[0];
    }
    return link;
  };

  const handleStartPersonalMeeting = async () => {
    setIsActionLoading(true);
    try {
      // Go directly to personal room (no need to save to recent meetings)
      router.push(`/meeting/${personalRoomId}`);
    } catch (error) {
      console.error("Failed to start personal meeting:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyPersonalRoomId = () => {
    navigator.clipboard.writeText(personalRoomId);
    ToastService.success("Personal Room ID copied to clipboard!");
  };

  const copyMeetingLink = (
    roomId: string,
    meetingName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent triggering the meeting join
    const meetingLink = `${window.location.origin}/meeting/${roomId}`;
    navigator.clipboard.writeText(meetingLink);
    ToastService.success(
      `Meeting link for "${meetingName}" copied to clipboard!`
    );
  };

  const handleScheduleMeeting = async () => {
    if (!scheduleForm.title || !scheduleForm.date || !scheduleForm.time) {
      ToastService.error("Please fill in all required fields");
      return;
    }

    setIsActionLoading(true);
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const scheduledDateTime = `${scheduleForm.date}T${scheduleForm.time}`;

      const scheduledMeeting: Meeting = {
        id: Date.now().toString(),
        name: scheduleForm.title,
        room_id: roomId,
        created_at: new Date().toISOString(),
        participants_count: 0,
        type: "scheduled",
        scheduled_for: scheduledDateTime,
        description: scheduleForm.description,
        status:
          new Date(scheduledDateTime) > new Date() ? "upcoming" : "completed",
      };

      // Save to localStorage
      const savedMeetings = localStorage.getItem("scheduledMeetings");
      const meetings = savedMeetings ? JSON.parse(savedMeetings) : [];
      meetings.unshift(scheduledMeeting);
      localStorage.setItem("scheduledMeetings", JSON.stringify(meetings));

      // Update stats
      const currentStats = { ...userStats };
      currentStats.meetingsHosted += 1;
      setUserStats(currentStats);
      localStorage.setItem("userStats", JSON.stringify(currentStats));

      ToastService.success(
        `Meeting "${scheduleForm.title}" scheduled successfully!`
      );
      setShowScheduleModal(false);
      setScheduleForm({ title: "", date: "", time: "", description: "" });
      loadRecentMeetings(); // Refresh the list
    } catch (error) {
      console.error("Failed to schedule meeting:", error);
      ToastService.error("Failed to schedule meeting. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCalendarIntegration = () => {
    ToastService.info("Calendar integration feature will be available soon!");
  };

  const cleanupExpiredMeetings = () => {
    try {
      const savedMeetings = localStorage.getItem("scheduledMeetings");
      const meetings = savedMeetings ? JSON.parse(savedMeetings) : [];

      const currentTime = new Date();
      let removedCount = 0;

      const validMeetings = meetings.filter((meeting: Meeting) => {
        // Only keep scheduled meetings
        if (meeting.type !== "scheduled" || !meeting.scheduled_for) {
          return false;
        }

        // For scheduled meetings, check if they're expired
        const scheduledTime = new Date(meeting.scheduled_for);
        const timeDifference = currentTime.getTime() - scheduledTime.getTime();

        // Remove meetings that ended more than 4 hours ago
        const fourHoursInMs = 4 * 60 * 60 * 1000;
        const shouldKeep = timeDifference < fourHoursInMs;

        if (!shouldKeep) {
          removedCount++;
        }

        return shouldKeep;
      });

      // Update localStorage and state
      localStorage.setItem("scheduledMeetings", JSON.stringify(validMeetings));
      setRecentMeetings(
        validMeetings.sort(
          (a: Meeting, b: Meeting) =>
            new Date(b.scheduled_for || b.created_at).getTime() -
            new Date(a.scheduled_for || a.created_at).getTime()
        )
      );

      if (removedCount > 0) {
        ToastService.success(
          `${removedCount} expired meeting${
            removedCount > 1 ? "s" : ""
          } removed from history`
        );
      } else {
        ToastService.info("No expired meetings found");
      }
    } catch (error) {
      console.error("Failed to cleanup meetings:", error);
      ToastService.error("Failed to cleanup expired meetings");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const formatMeetingTime = (meeting: Meeting) => {
    if (meeting.type === "scheduled" && meeting.scheduled_for) {
      const scheduledDate = new Date(meeting.scheduled_for);
      const currentTime = new Date();
      const timeDifference = currentTime.getTime() - scheduledDate.getTime();

      if (timeDifference > 0) {
        // Meeting has passed
        const fourHoursInMs = 4 * 60 * 60 * 1000;
        const hoursLeft = Math.ceil(
          (fourHoursInMs - timeDifference) / (60 * 60 * 1000)
        );

        if (hoursLeft > 0) {
          return `Ended ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()} • Auto-delete in ${hoursLeft}h`;
        } else {
          return `Ended ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()} • Will be deleted`;
        }
      } else {
        // Future meeting
        return `Scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}`;
      }
    } else {
      const createdDate = new Date(meeting.created_at);
      return `Created on ${createdDate.toLocaleDateString()} at ${createdDate.toLocaleTimeString()}`;
    }
  };

  const getMeetingStatusBadge = (meeting: Meeting) => {
    if (meeting.type === "scheduled" && meeting.scheduled_for) {
      const scheduledTime = new Date(meeting.scheduled_for);
      const currentTime = new Date();
      const timeDifference = currentTime.getTime() - scheduledTime.getTime();
      const fourHoursInMs = 4 * 60 * 60 * 1000;

      // Meeting has passed and will be cleaned up soon
      if (timeDifference > 0 && timeDifference < fourHoursInMs) {
        const hoursLeft = Math.ceil(
          (fourHoursInMs - timeDifference) / (60 * 60 * 1000)
        );
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Expires in {hoursLeft}h
          </span>
        );
      }

      // Future meeting
      if (timeDifference < 0) {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Scheduled
          </span>
        );
      }

      // Past meeting (shouldn't appear if cleanup is working)
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Past
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Instant
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
                  Umalo
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block font-medium">
                  Video Conference Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-lg rounded-2xl px-4 py-3 shadow-lg border border-white/40">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <span className="text-sm font-semibold text-slate-800">
                      {user.name}
                    </span>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-300 border border-slate-200 hover:border-red-200 hover:shadow-md"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Welcome Section */}
        <div className="mb-8 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 mb-3">
            Welcome back,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {user.name.split(" ")[0]}
            </span>
            ! 👋
          </h2>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto lg:mx-0">
            Ready to connect with your team? Start or join a meeting below and
            experience seamless video conferencing.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="xl:col-span-8 space-y-8">
            {/* Quick Start */}
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-2xl overflow-hidden group">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12 group-hover:rotate-45 transition-transform duration-1000"></div>

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">
                      Ready to connect?
                    </h3>
                    <p className="text-blue-100 text-sm md:text-base leading-relaxed">
                      Start a new meeting instantly or schedule one for later.
                      Connect with anyone, anywhere.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleNewMeeting}
                    disabled={isActionLoading}
                    className="flex items-center justify-center gap-3 bg-white text-blue-700 px-6 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                  >
                    <Video size={20} />
                    {isActionLoading ? "Creating..." : "New Meeting"}
                  </button>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur-md text-white px-6 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <Calendar size={20} />
                    Schedule Meeting
                  </button>
                </div>
              </div>
            </div>

            {/* Join Meeting */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:border-blue-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800">
                    Join a meeting
                  </h3>
                  <p className="text-slate-600 font-medium">
                    Enter meeting ID or paste invitation link
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex bg-slate-100 rounded-2xl p-1">
                  <button
                    className={`flex-1 px-4 py-3 font-semibold text-sm transition-all duration-300 rounded-xl ${
                      activeTab === "id"
                        ? "text-blue-600 bg-white shadow-lg transform scale-105"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                    onClick={() => setActiveTab("id")}
                  >
                    Meeting ID
                  </button>
                  <button
                    className={`flex-1 px-4 py-3 font-semibold text-sm transition-all duration-300 rounded-xl ${
                      activeTab === "link"
                        ? "text-blue-600 bg-white shadow-lg transform scale-105"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                    onClick={() => setActiveTab("link")}
                  >
                    Meeting Link
                  </button>
                </div>
                {activeTab === "id" ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter meeting ID (e.g., ABC123)"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      className="w-full px-6 py-4 pl-14 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-center font-mono text-lg tracking-wider bg-white/80 backdrop-blur-sm transition-all duration-300"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleJoinMeeting()
                      }
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="https://umalo.com/meeting/ABC123"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full px-6 py-4 pl-14 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-300"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleJoinMeeting()
                      }
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                      <ExternalLink className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                )}
                <button
                  onClick={handleJoinMeeting}
                  disabled={
                    activeTab === "id" ? !meetingId.trim() : !meetingLink.trim()
                  }
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:from-slate-300 disabled:via-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none disabled:shadow-none"
                >
                  Join Meeting
                </button>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <Clock size={16} />
                  <span className="font-medium">
                    Meeting ID is provided by the host
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Meetings */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-800">
                      Recent meetings
                    </h3>
                    <p className="text-slate-600 font-medium">
                      Your scheduled meetings with links
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {recentMeetings.length > 0 && (
                    <>
                      <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-semibold">
                        {recentMeetings.length} total
                      </span>
                      <button
                        onClick={loadRecentMeetings}
                        className="p-2.5 text-slate-500 hover:text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300 hover:scale-110"
                        title="Refresh meetings"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={cleanupExpiredMeetings}
                        className="p-2.5 text-slate-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-300 hover:scale-110"
                        title="Clean up expired meetings"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {recentMeetings.length > 0 ? (
                <div className="space-y-4">
                  {recentMeetings.slice(0, 5).map((meeting, index) => (
                    <div
                      key={meeting.id}
                      className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 cursor-pointer transition-all duration-300 hover:shadow-lg hover:transform hover:-translate-y-1"
                      onClick={() => {
                        if (
                          meeting.type === "scheduled" &&
                          meeting.scheduled_for
                        ) {
                          const scheduledTime = new Date(meeting.scheduled_for);
                          const now = new Date();
                          const timeDiff =
                            scheduledTime.getTime() - now.getTime();

                          if (timeDiff > 0 && timeDiff < 15 * 60 * 1000) {
                            router.push(`/meeting/${meeting.room_id}`);
                          } else if (
                            timeDiff <= 0 &&
                            Math.abs(timeDiff) < 2 * 60 * 60 * 1000
                          ) {
                            router.push(`/meeting/${meeting.room_id}`);
                          } else {
                            ToastService.warning(
                              `This meeting is scheduled for ${scheduledTime.toLocaleString()}. You can join 15 minutes before the start time.`
                            );
                          }
                        } else {
                          router.push(`/meeting/${meeting.room_id}`);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                            meeting.type === "scheduled"
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                              : "bg-gradient-to-br from-green-500 to-emerald-600"
                          }`}
                        >
                          {meeting.type === "scheduled" ? (
                            <Calendar size={20} className="text-white" />
                          ) : (
                            <Video size={20} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-bold text-slate-800 truncate text-lg">
                              {meeting.name}
                            </p>
                            {getMeetingStatusBadge(meeting)}
                          </div>
                          <p className="text-sm text-slate-600 mb-1 font-medium">
                            {formatMeetingTime(meeting)}
                          </p>
                          {meeting.description && (
                            <p className="text-xs text-slate-500 truncate">
                              {meeting.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) =>
                            copyMeetingLink(meeting.room_id, meeting.name, e)
                          }
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 hover:scale-110"
                          title="Copy meeting link"
                        >
                          <Copy size={16} />
                        </button>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-1 font-medium">
                            Meeting ID
                          </p>
                          <code className="text-sm font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-800 font-semibold">
                            {meeting.room_id}
                          </code>
                        </div>
                        <ExternalLink
                          size={18}
                          className="text-slate-400 group-hover:text-slate-600 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Calendar size={28} className="text-slate-400" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-3">
                    No scheduled meetings
                  </h4>
                  <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                    Schedule your first meeting and access it easily here. Keep
                    all your meetings organized in one place.
                  </p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-base bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105"
                  >
                    Schedule your first meeting →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-4 space-y-6">
            {/* User Stats */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Your stats
                  </h3>
                  <p className="text-slate-600 font-medium">
                    Performance overview
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 rounded-2xl p-5 border-2 border-blue-200/50 hover:border-blue-300 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Video size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Meetings hosted
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          This month
                        </p>
                      </div>
                    </div>
                    <span className="text-3xl font-black text-blue-600">
                      {userStats.meetingsHosted}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 via-emerald-100 to-green-100 rounded-2xl p-5 border-2 border-green-200/50 hover:border-green-300 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Users size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Participants met
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          Total connections
                        </p>
                      </div>
                    </div>
                    <span className="text-3xl font-black text-green-600">
                      {userStats.participantsMet}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Meeting Room */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Personal room
                  </h3>
                  <p className="text-slate-600 font-medium">
                    Your dedicated meeting space
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border-2 border-slate-200">
                  <p className="text-sm font-bold text-slate-800 mb-4">
                    Your personal room ID:
                  </p>
                  <div className="flex items-center gap-3">
                    <code className="bg-white border-2 border-slate-300 px-5 py-4 rounded-2xl font-mono text-lg flex-1 text-center tracking-wider font-black text-slate-800 shadow-lg">
                      {personalRoomId}
                    </code>
                    <button
                      onClick={copyPersonalRoomId}
                      className="p-4 text-slate-500 hover:text-slate-700 rounded-2xl hover:bg-slate-100 transition-all duration-300 border-2 border-slate-300 hover:border-slate-400 hover:scale-110"
                      title="Copy ID"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                    Share this ID for recurring meetings
                  </p>
                </div>

                <button
                  onClick={handleStartPersonalMeeting}
                  disabled={isActionLoading}
                  className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white py-4 rounded-2xl font-bold hover:from-green-700 hover:via-emerald-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  {isActionLoading ? "Starting..." : "Start Personal Meeting"}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Quick actions
                  </h3>
                  <p className="text-slate-600 font-medium">
                    Shortcuts & settings
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="w-full flex items-center gap-4 p-4 text-left rounded-2xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-300 group border-2 border-transparent hover:border-slate-200 hover:scale-105"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-slate-200 transition-all duration-300">
                    <Settings size={16} className="text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">Settings</span>
                    <p className="text-xs text-slate-600 font-medium">
                      Audio & video preferences
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleCalendarIntegration}
                  className="w-full flex items-center gap-4 p-4 text-left rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 group border-2 border-transparent hover:border-blue-200 hover:scale-105"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-all duration-300">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">
                      Calendar sync
                    </span>
                    <p className="text-xs text-slate-600 font-medium">
                      Integrate with your calendar
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setShowHelpModal(true)}
                  className="w-full flex items-center gap-4 p-4 text-left rounded-2xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all duration-300 group border-2 border-transparent hover:border-orange-200 hover:scale-105"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-all duration-300">
                    <HelpCircle size={16} className="text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">
                      Help & Support
                    </span>
                    <p className="text-xs text-slate-600 font-medium">
                      Get help and tutorials
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-white/50 transform transition-all animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">
                  Schedule Meeting
                </h3>
                <p className="text-slate-600 font-medium">
                  Plan your meeting in advance
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter meeting title"
                  value={scheduleForm.title}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, title: e.target.value })
                  }
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, date: e.target.value })
                    }
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-300 font-medium"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, time: e.target.value })
                    }
                    className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Add meeting agenda or notes"
                  value={scheduleForm.description}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-white/80 backdrop-blur-sm transition-all duration-300 font-medium"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-300 rounded-2xl hover:bg-slate-50 font-bold transition-all duration-300 text-slate-700 hover:border-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMeeting}
                  disabled={
                    !scheduleForm.title ||
                    !scheduleForm.date ||
                    !scheduleForm.time ||
                    isActionLoading
                  }
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:from-slate-300 disabled:via-slate-400 disabled:to-slate-500 font-bold transition-all duration-300 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  {isActionLoading ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-white/50 transform transition-all animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Settings</h3>
                <p className="text-slate-600 font-medium">
                  Configure your preferences
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-5">
                  Device Settings
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-sm font-semibold text-slate-700">
                      Camera
                    </span>
                    <select className="border-2 border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-medium min-w-[140px]">
                      <option>Default Camera</option>
                      <option>Built-in Camera</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-sm font-semibold text-slate-700">
                      Microphone
                    </span>
                    <select className="border-2 border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-medium min-w-[140px]">
                      <option>Default Microphone</option>
                      <option>Built-in Microphone</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-sm font-semibold text-slate-700">
                      Speaker
                    </span>
                    <select className="border-2 border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-medium min-w-[140px]">
                      <option>Default Speaker</option>
                      <option>Built-in Speaker</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-5">
                  Meeting Preferences
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">
                        Join with camera off
                      </span>
                      <p className="text-xs text-slate-600 font-medium">
                        Camera will be disabled by default
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 focus:ring-2"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">
                        Join with microphone muted
                      </span>
                      <p className="text-xs text-slate-600 font-medium">
                        Microphone will be muted by default
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 focus:ring-2"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl border border-white/50 transform transition-all animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <HelpCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">
                  Help & Support
                </h3>
                <p className="text-slate-600 font-medium">
                  Get help and learn the basics
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 rounded-2xl p-5 border-2 border-blue-200/50">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-3 text-lg">
                    <Video size={20} />
                    Getting Started
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed font-medium">
                    Click "New Meeting" to instantly start a video conference,
                    or use "Join" to enter an existing meeting with an ID or
                    link.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 via-emerald-100 to-green-100 rounded-2xl p-5 border-2 border-green-200/50">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-3 text-lg">
                    <Calendar size={20} />
                    Scheduling Meetings
                  </h4>
                  <p className="text-sm text-green-800 leading-relaxed font-medium">
                    Use "Schedule Meeting" to create meetings for later.
                    Scheduled meetings appear in your recent meetings list and
                    can be joined when the time comes.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 rounded-2xl p-5 border-2 border-purple-200/50">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-3 text-lg">
                    <User size={20} />
                    Personal Room
                  </h4>
                  <p className="text-sm text-purple-800 leading-relaxed font-medium">
                    Use your personal room ID for recurring meetings. Share this
                    ID with participants for easy access to your dedicated
                    meeting space.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 via-amber-100 to-orange-100 rounded-2xl p-5 border-2 border-yellow-200/50">
                  <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-3 text-lg">
                    <Settings size={20} />
                    Troubleshooting
                  </h4>
                  <p className="text-sm text-yellow-800 leading-relaxed font-medium">
                    If you experience audio/video issues, check your browser
                    permissions and device settings. Make sure your camera and
                    microphone are allowed.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border-2 border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4 text-lg">
                  Contact Support
                </h4>
                <div className="space-y-3 text-sm text-slate-700">
                  <p className="flex items-center gap-3 font-medium">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Email: support@umalo.com
                  </p>
                  <p className="flex items-center gap-3 font-medium">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Phone: +1 (555) 123-4567
                  </p>
                  <p className="flex items-center gap-3 font-medium">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    Available 24/7
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 text-white rounded-2xl hover:from-orange-700 hover:via-red-700 hover:to-orange-800 font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
