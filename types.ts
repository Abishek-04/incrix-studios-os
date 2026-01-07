export type Role = 'manager' | 'creator' | 'editor' | 'mograph';

export enum Platform {
  Instagram = 'instagram',
  YouTube = 'youtube',
  TikTok = 'tiktok',
  LinkedIn = 'linkedin',
  WhatsApp = 'whatsapp',
  Email = 'email'
}

export enum Vertical {
  Automation = 'automation',
  Software = 'software',
  Branding = 'branding',
  Education = 'education'
}

export enum Stage {
  Backlog = 'Backlog',
  Scripting = 'Scripting',
  Shooting = 'Shooting',
  Editing = 'Editing',
  Review = 'Review',
  Done = 'Done'
}

export enum Status {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Done = 'Done',
  Blocked = 'Blocked'
}

export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

export interface UserQuota {
    longVideo: number; // Target count
    shortVideo: number; // Target count
    period: 'weekly' | 'monthly';
}

export interface User {
    id: string;
    name: string;
    role: Role;
    email: string;
    phoneNumber?: string; // For WhatsApp
    notifyViaWhatsapp?: boolean;
    notifyViaEmail?: boolean;
    avatarColor: string;
    niche?: string;
    active: boolean;
    quota?: UserQuota;
}

export interface Channel {
    id: string;
    platform: Platform;
    name: string;
    link: string; // The source URL
    avatarUrl?: string; // Optional real image URL
    email: string;
    credentials?: string; // API Key or Token
}

export interface Comment {
  id: string;
  author: Role;
  text: string;
  timestamp: number;
}

export interface PerformanceMetrics {
    views: number;
    likes: number;
    comments: number;
    retention: string; // e.g., "55%"
    sources?: string[]; // Grounding URLs from Gemini Search
    lastUpdated: number;
}

export interface Project {
  id: string;
  title: string;
  topic: string;
  vertical: Vertical;
  platform: Platform;
  channelId?: string; // Links to a specific Channel entity
  role: Role; // The primary role currently responsible
  creator: string; // Name or ID
  editor: string; // Name or ID
  stage: Stage;
  status: Status;
  priority: Priority;
  lastUpdated: number;
  dueDate: number;
  durationMinutes: number; // For analytics
  script: string;
  tasks: { id: string; text: string; done: boolean }[];
  technicalNotes: string;
  reviewLink?: string;
  publishedLink?: string; // Final social media link
  comments: Comment[];
  metrics?: PerformanceMetrics; // New field for post-production data
  hasMographNeeds: boolean;
  archived: boolean;
}

export interface KpiData {
  totalVolume: number; // minutes
  successRate: number; // percentage
  stuckCount: number;
  urgentCount: number;
}