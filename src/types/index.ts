export interface Post {
  id: string;
  title: string;
  description: string;
  category: "events" | "for-sale" | "help" | "recommendations";
  lat: number;
  lng: number;
  created_at: string;
  updated_at?: string;
  user_id: string;
  attachments?: string[];
  expires_at: string;
  is_archived: boolean;
  bump_count: number;
  last_bumped_at?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  attachments?: string[];
}

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface User {
  id: string;
  created_at: string;
}

export type FilterCategory =
  | "all"
  | "events"
  | "for-sale"
  | "help"
  | "recommendations";
