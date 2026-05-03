export type UserRole = 'staff' | 'manager';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  team?: string;
}

export interface Category {
  id: string;
  zone: string;
  name: string;
  areas: string[];
  defaultChecklist: string[];
  order: number;
}

export interface Comparison {
  id: string;
  staffId: string;
  staffEmail: string;
  zone: string;
  category: string;
  area: string;
  subject?: string; // Target/Subject identifier
  checklist: Record<string, boolean>;
  beforeImages: string[]; // base64
  afterImage: string; // base64
  aiFeedback?: string;
  achievementScore?: number;
  improvements?: string[];
  risks?: string[];
  modelVersion?: string;
  status: 'pending' | 'completed';
  createdAt: any; // Firestore Timestamp
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'clock_in' | 'clock_out';
  timestamp: any;
}

export interface UserStatus {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isOnline: boolean;
  lastActive: any;
  totalComparisons: number;
}
