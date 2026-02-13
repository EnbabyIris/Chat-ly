import { API_ENDPOINTS, HTTP_STATUS } from "../shared/constants";
import type {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  User,
  UserListItem,
  UpdateProfileDTO,
  Chat,
  ChatListItem,
  CreateChatDTO,
  UpdateChatDTO,
  Message,
  SendMessageDTO,
  UpdateMessageDTO,
  ApiResponse,
} from "../shared/types";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Token storage keys
export const TOKEN_KEYS = {
  ACCESS_TOKEN: "chat_turbo_access_token",
  REFRESH_TOKEN: "chat_turbo_refresh_token",
  USER_DATA: "chat_turbo_user_data",
} as const;

// Token management utilities
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  },

  getUserData: (): User | null => {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem(TOKEN_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  setTokens: (
    accessToken: string,
    refreshToken: string,
    userData: User,
  ): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(userData));
  },

  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.USER_DATA);
  },

  hasValidTokens: (): boolean => {
    return !!(tokenStorage.getAccessToken() && tokenStorage.getRefreshToken());
  },
};

// API Error class for client-side error handling
export class ClientApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: string,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

// API Client class
class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuthRetry = false,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add authorization header if token exists
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      defaultHeaders.Authorization = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        // Handle token expiration (skip if this is already a refresh attempt)
        if (
          response.status === HTTP_STATUS.UNAUTHORIZED &&
          accessToken &&
          !skipAuthRetry
        ) {
          // Try to refresh token (dedup concurrent refreshes)
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request (skip auth retry to prevent infinite loop)
            return this.request(endpoint, options, true);
          } else {
            // Refresh failed, clear tokens and redirect to login
            tokenStorage.clearTokens();
            if (typeof window !== "undefined") {
              window.location.href = "/auth";
            }
          }
        }

        throw new ClientApiError(
          response.status,
          data.message || "An error occurred",
          data.details,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ClientApiError) {
        throw error;
      }

      // Network or other errors
      throw new ClientApiError(
        0,
        "Network error occurred. Please check your connection.",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  // Authentication methods
  async register(data: RegisterDTO): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      `/api/v1${API_ENDPOINTS.AUTH.REGISTER}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    // Store tokens after successful registration
    if (response.success && response.data) {
      // Map AuthResponse user to full User type
      const fullUser: User = {
        ...response.data.user,
        lastSeen: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      tokenStorage.setTokens(
        response.data.accessToken,
        response.data.refreshToken,
        fullUser,
      );
    }

    return response.data!;
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      `/api/v1${API_ENDPOINTS.AUTH.LOGIN}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    // Store tokens after successful login
    if (response.success && response.data) {
      // Map AuthResponse user to full User type
      const fullUser: User = {
        ...response.data.user,
        lastSeen: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      tokenStorage.setTokens(
        response.data.accessToken,
        response.data.refreshToken,
        fullUser,
      );
    }

    return response.data!;
  }

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();

    try {
      await this.request(`/api/v1${API_ENDPOINTS.AUTH.LOGOUT}`, {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear tokens
      tokenStorage.clearTokens();
    }
  }

  async refreshToken(): Promise<boolean> {
    // Dedup concurrent refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._doRefresh(refreshToken);

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _doRefresh(refreshToken: string): Promise<boolean> {
    try {
      // Use skipAuthRetry=true to prevent infinite refresh loop
      const response = await this.request<{ accessToken: string }>(
        `/api/v1${API_ENDPOINTS.AUTH.REFRESH}`,
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
        true, // skipAuthRetry - don't try to refresh again if this fails
      );

      if (response.success && response.data) {
        // Update only the access token
        const userData = tokenStorage.getUserData();
        if (userData) {
          tokenStorage.setTokens(
            response.data.accessToken,
            refreshToken,
            userData,
          );
          return true;
        }
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }

    return false;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>(
      `/api/v1${API_ENDPOINTS.AUTH.ME}`,
    );

    if (response.success && response.data) {
      // Update stored user data
      const accessToken = tokenStorage.getAccessToken();
      const refreshToken = tokenStorage.getRefreshToken();

      if (accessToken && refreshToken) {
        tokenStorage.setTokens(accessToken, refreshToken, response.data.user);
      }

      return response.data.user;
    }

    throw new ClientApiError(500, "Failed to fetch user data");
  }

  // ================================
  // User Management Methods
  // ================================

  /**
   * Get all users with optional filters
   */
  async getAllUsers(filters?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: UserListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/v1${API_ENDPOINTS.USERS.ALL}${queryString ? `?${queryString}` : ""}`;

    const response = await this.request<{
      users: UserListItem[];
      total: number;
      page: number;
      limit: number;
    }>(endpoint);

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to fetch users");
  }

  /**
   * Search users by query string
   */
  async searchUsers(query: string, limit?: number): Promise<UserListItem[]> {
    const params = new URLSearchParams({ query });
    if (limit) params.append("limit", limit.toString());

    const response = await this.request<UserListItem[]>(
      `/api/v1${API_ENDPOINTS.USERS.SEARCH}?${params.toString()}`,
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to search users");
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const response = await this.request<User>(
      `/api/v1${API_ENDPOINTS.USERS.PROFILE(userId)}`,
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to fetch user");
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileDTO): Promise<User> {
    const response = await this.request<User>(
      `/api/v1${API_ENDPOINTS.USERS.UPDATE_PROFILE}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );

    if (response.success && response.data) {
      // Update stored user data
      const accessToken = tokenStorage.getAccessToken();
      const refreshToken = tokenStorage.getRefreshToken();

      if (accessToken && refreshToken) {
        tokenStorage.setTokens(accessToken, refreshToken, response.data);
      }

      return response.data;
    }

    throw new ClientApiError(500, "Failed to update profile");
  }

  /**
   * Get currently online users
   */
  async getOnlineUsers(): Promise<{ users: UserListItem[]; total: number }> {
    const response = await this.request<{
      users: UserListItem[];
      total: number;
    }>(`/api/v1${API_ENDPOINTS.USERS.ONLINE}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to fetch online users");
  }

  // ================================
  // Chat Management Methods
  // ================================

  /**
   * Get all chats for current user
   */
  async getChats(filters?: {
    search?: string;
    type?: "all" | "group" | "direct";
  }): Promise<ChatListItem[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.type && filters.type !== "all")
      params.append("type", filters.type);

    const queryString = params.toString();
    const endpoint = `/api/v1${API_ENDPOINTS.CHATS.LIST}${queryString ? `?${queryString}` : ""}`;

    const response = await this.request<ChatListItem[]>(endpoint);

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to fetch chats");
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string): Promise<Chat> {
    const response = await this.request<Chat>(
      `/api/v1${API_ENDPOINTS.CHATS.GET(chatId)}`,
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to fetch chat");
  }

  /**
   * Create a new chat
   */
  async createChat(data: CreateChatDTO): Promise<Chat> {
    const response = await this.request<{ chat: Chat }>(
      `/api/v1${API_ENDPOINTS.CHATS.CREATE}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    if (response.success && response.data?.chat) {
      return response.data.chat;
    }

    throw new ClientApiError(500, "Failed to create chat");
  }

  /**
   * Update a chat
   */
  async updateChat(chatId: string, data: UpdateChatDTO): Promise<Chat> {
    const response = await this.request<Chat>(
      `/api/v1${API_ENDPOINTS.CHATS.UPDATE(chatId)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to update chat");
  }

  /**
   * Delete a chat
   */
  async deleteChat(chatId: string): Promise<void> {
    const response = await this.request<void>(
      `/api/v1${API_ENDPOINTS.CHATS.DELETE(chatId)}`,
      {
        method: "DELETE",
      },
    );

    if (!response.success) {
      throw new ClientApiError(500, "Failed to delete chat");
    }
  }

  /**
   * Get messages for a chat
   */
  async getChatMessages(
    chatId: string,
    filters?: { before?: string; limit?: number },
  ): Promise<{ messages: Message[]; hasMore: boolean; nextCursor?: string }> {
    const params = new URLSearchParams();
    if (filters?.before) params.append("before", filters.before);
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/v1${API_ENDPOINTS.CHATS.MESSAGES(chatId)}${queryString ? `?${queryString}` : ""}`;

    const response = await this.request<{
      messages: Message[];
      hasMore: boolean;
      nextCursor?: string;
    }>(endpoint);

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to fetch messages");
  }

  // ================================
  // Group Management Methods
  // ================================

  /**
   * Create a new group chat
   */
  async createGroupChat(
    data: import("../shared/types").CreateGroupChatDTO,
  ): Promise<{
    chat: import("../shared/types").GroupChat;
    participants: import("../shared/types").GroupParticipant[];
    success: boolean;
  }> {
    const response = await this.request<{
      chat: import("../shared/types").GroupChat;
      participants: import("../shared/types").GroupParticipant[];
      success: boolean;
    }>(`/api/v1${API_ENDPOINTS.GROUPS.CREATE}`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to create group chat");
  }

  /**
   * Add participants to a group
   */
  async addGroupParticipants(
    chatId: string,
    participantIds: string[],
  ): Promise<{
    chatId: string;
    participantId: string;
    operation: "added";
    success: boolean;
  }> {
    const response = await this.request<{
      chatId: string;
      participantId: string;
      operation: "added";
      success: boolean;
    }>(`/api/v1${API_ENDPOINTS.GROUPS.ADD_PARTICIPANTS(chatId)}`, {
      method: "POST",
      body: JSON.stringify({ participantIds }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to add participants");
  }

  /**
   * Remove a participant from a group
   */
  async removeGroupParticipant(
    chatId: string,
    participantId: string,
  ): Promise<{
    chatId: string;
    participantId: string;
    operation: "removed";
    success: boolean;
  }> {
    const response = await this.request<{
      chatId: string;
      participantId: string;
      operation: "removed";
      success: boolean;
    }>(
      `/api/v1${API_ENDPOINTS.GROUPS.REMOVE_PARTICIPANT(chatId, participantId)}`,
      {
        method: "DELETE",
      },
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to remove participant");
  }

  /**
   * Transfer admin role
   */
  async transferGroupAdmin(
    chatId: string,
    newAdminId: string,
  ): Promise<{
    chatId: string;
    participantId: string;
    operation: "admin_transferred";
    newAdminId: string;
    success: boolean;
  }> {
    const response = await this.request<{
      chatId: string;
      participantId: string;
      operation: "admin_transferred";
      newAdminId: string;
      success: boolean;
    }>(`/api/v1${API_ENDPOINTS.GROUPS.TRANSFER_ADMIN(chatId)}`, {
      method: "PUT",
      body: JSON.stringify({ newAdminId }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to transfer admin role");
  }

  /**
   * Archive a group chat
   */
  async archiveGroupChat(
    chatId: string,
  ): Promise<{ chatId: string; operation: "archived"; success: boolean }> {
    const response = await this.request<{
      chatId: string;
      operation: "archived";
      success: boolean;
    }>(`/api/v1${API_ENDPOINTS.GROUPS.ARCHIVE(chatId)}`, {
      method: "PUT",
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to archive group chat");
  }

  /**
   * Delete a group chat
   */
  async deleteGroupChat(
    chatId: string,
    hardDelete?: boolean,
  ): Promise<{ chatId: string; operation: "deleted"; success: boolean }> {
    const response = await this.request<{
      chatId: string;
      operation: "deleted";
      success: boolean;
    }>(`/api/v1${API_ENDPOINTS.GROUPS.DELETE(chatId)}`, {
      method: "DELETE",
      body: JSON.stringify({ hardDelete }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to delete group chat");
  }

  // ================================
  // Message Management Methods
  // ================================

  /**
   * Send a message
   */
  async sendMessage(data: SendMessageDTO): Promise<Message> {
    const response = await this.request<Message>(
      `/api/v1${API_ENDPOINTS.MESSAGES.SEND}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to send message");
  }

  /**
   * Update a message
   */
  async updateMessage(
    messageId: string,
    data: UpdateMessageDTO,
  ): Promise<Message> {
    const response = await this.request<Message>(
      `/api/v1${API_ENDPOINTS.MESSAGES.UPDATE(messageId)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new ClientApiError(500, "Failed to update message");
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const response = await this.request<void>(
      `/api/v1${API_ENDPOINTS.MESSAGES.DELETE(messageId)}`,
      {
        method: "DELETE",
      },
    );

    if (!response.success) {
      throw new ClientApiError(500, "Failed to delete message");
    }
  }

  /**
   * Mark a message as read
   */
  async markMessageRead(messageId: string): Promise<void> {
    const response = await this.request<void>(
      `/api/v1${API_ENDPOINTS.MESSAGES.READ(messageId)}`,
      {
        method: "POST",
      },
    );

    if (!response.success) {
      throw new ClientApiError(500, "Failed to mark message as read");
    }
  }

  // Generic methods for other API calls
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);
