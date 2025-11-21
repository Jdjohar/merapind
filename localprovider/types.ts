// types.ts
export enum UserRole {
  USER = 'USER',
  PROVIDER = 'PROVIDER'
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  description: string;
  imageUrl: string;
  isVerified: boolean;
  location: string;
  availability: string;
  tags: string[];
  reviews: Review[];
    lat?: number;
  lng?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  audioUrl?: string; // Simulated audio data
  timestamp: Date;
  isMe: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  // icon intentionally omitted — UI should supply icon components
}
