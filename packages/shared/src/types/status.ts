export interface Status {
  id: string;
  userId: string;
  content: string | null; // text content (optional)
  imageUrl: string | null; // image URL (optional)
  createdAt: Date;
  expiresAt: Date;
}

export interface StatusWithUser extends Status {
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface CreateStatusDTO {
  content?: string; // optional text
  imageUrl?: string; // optional image URL
}

export interface StatusListResponse {
  statuses: StatusWithUser[];
  total: number;
}