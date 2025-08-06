export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  joinedAt: string;
  stream?: MediaStream;
}

export interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
  };
  timestamp: string;
}

export interface Room {
  id: number;
  room_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  max_participants: number;
  created_by: string;
  is_active: boolean;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  creator?: User;
  participants?: Participant[];
  messages?: Message[];
}

export interface MeetingState {
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isRecording: boolean;
  participants: Participant[];
  messages: Message[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
}

export interface WebRTCConnection {
  socketId: string;
  peerConnection: RTCPeerConnection;
  stream?: MediaStream;
}
