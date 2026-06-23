export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  studentProfile?: {
    teacherId: string | null;
    teacherStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    classId: string | null;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Task {
  id: string;
  taskType: 'NEW' | 'REVISION';
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  dueDate: string;
  status: 'ASSIGNED' | 'COMPLETED' | 'OVERDUE';
  notes?: string;
  teacher: { fullName: string };
  student: { fullName: string };
  submissions: { id: string; status: string }[];
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  examType: 'WEEKLY' | 'MONTHLY';
  startTime: string;
  endTime: string;
  timeLimitMinutes: number;
  passingScore: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  teacher: { fullName: string };
  _count: { questions: number; submissions: number };
  maxScore?: number;
  submissions?: { id: string; totalScore: number | null; status: string }[];
}

export interface Question {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface Submission {
  id: string;
  status: 'PENDING' | 'REVIEWED' | 'REVISION_NEEDED';
  audioUrl: string;
  submittedAt: string;
  student: { fullName: string };
  task: { surahNumber: number; ayahStart: number; ayahEnd: number; taskType: string; notes?: string };
  assessment?: {
    memorizationScore: number;
    tajweedScore: number;
    fluencyScore: number;
    overallScore: number;
    feedback: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  partner: { id: string; fullName: string; role: string; avatarUrl: string | null };
  lastMessage: { content: string; createdAt: string; isRead: boolean; senderId: string } | null;
  unread: number;
}

export interface Session {
  id: string;
  title: string;
  description?: string;
  sessionType: 'MEMORIZATION' | 'TAJWEED' | 'EDUCATIONAL';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants: number;
  meetingUrl?: string;
  teacher: { id: string; fullName: string };
  _count: { attendances: number };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ANNOUNCEMENT' | 'PRIVATE' | 'AUTO';
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; fullName: string; role: string };
}

export interface DashboardPayload {
  dashboard: {
    role: UserRole;
    stats: Record<string, number>;
    dailyTask?: {
      id: string;
      surahNumber: number;
      ayahStart: number;
      ayahEnd: number;
      dueDate: string;
      teacher?: { fullName: string };
    } | null;
    notifications?: Array<{ id: string; title: string; message: string; isRead?: boolean; createdAt: string }>;
    upcomingExams?: Array<{ id: string; title: string; examType: string; startTime: string; timeLimitMinutes: number }>;
  };
}
