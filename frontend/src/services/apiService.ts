import axios from "axios";
import { User } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("API Error:", error.response?.data || error.message);
    console.error("API Error Status:", error.response?.status);
    console.error("API Error Config:", error.config?.url);

    if (error.response?.status === 401) {
      // Token expired or invalid - only redirect if we're not already on login page
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        console.log("API: 401 error, redirecting to login");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface RoomData {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  max_participants?: number;
}

class ApiService {
  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  }

  async getUser(): Promise<User> {
    const response = await apiClient.get("/auth/user");
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/refresh");
    return response.data;
  }

  // Room management
  async createRoom(roomData: Partial<RoomData>): Promise<RoomData> {
    const response = await apiClient.post("/rooms", roomData);
    return response.data;
  }

  async getRoom(roomId: string): Promise<RoomData> {
    const response = await apiClient.get(`/rooms/${roomId}`);
    return response.data;
  }

  async getUserRooms(): Promise<RoomData[]> {
    const response = await apiClient.get("/rooms");
    return response.data;
  }

  async joinRoom(
    roomId: string
  ): Promise<{ success: boolean; room: RoomData }> {
    const response = await apiClient.post(`/rooms/${roomId}/join`);
    return response.data;
  }

  async leaveRoom(roomId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/rooms/${roomId}/leave`);
    return response.data;
  }

  async deleteRoom(roomId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/rooms/${roomId}`);
    return response.data;
  }

  // Utility methods
  setAuthToken(token: string): void {
    console.log("Setting auth token:", token ? "***token***" : "empty");
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
  }

  getAuthToken(): string | null {
    const token = localStorage.getItem("access_token");
    console.log("Getting auth token:", token ? "***exists***" : "null");
    return token;
  }

  isAuthenticated(): boolean {
    const authenticated = !!this.getAuthToken();
    console.log("Is authenticated:", authenticated);
    return authenticated;
  }

  setUser(user: User): void {
    console.log("Setting user:", user.name || "empty user");
    if (user && user.id) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    console.log("Getting stored user:", user?.name || "null");
    return user;
  }
}

export const apiService = new ApiService();
