export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isOnline: boolean;
}

export interface UpdateProfileDTO {
  name?: string;
  bio?: string | null;
  avatar?: string | null;
}

// ChatUser type for UI components (compatible with old mock data structure)
export interface ChatUser {
  _id: string;
  name: string;
  pic: string;
  email?: string;
  isOnline?: boolean;
}