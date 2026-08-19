export interface Post {
  id: string;
  title: string;
  description: string;
  category: "events" | "for-sale" | "help" | "recommendations";
  lat: number;
  lng: number;
  created_at: string;
  user_id: string;
  attachments?: string[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
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
