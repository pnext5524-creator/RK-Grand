
export enum ModuleType {
  DASHBOARD = 'DASHBOARD',
  HR = 'HR',
  ENGINEERING = 'ENGINEERING',
  TIME_TRACKING = 'TIME_TRACKING',
  TASKS = 'TASKS',
  CHAT = 'CHAT',
  ADMIN_SETTINGS = 'ADMIN_SETTINGS'
}

export type ChatType = 'DIRECT' | 'GROUP' | 'CHANNEL_NEWS' | 'CHANNEL_DEPT' | 'CHANNEL_ORDERS';

export interface UserPermissions {
  [ModuleType.DASHBOARD]: boolean;
  [ModuleType.HR]: boolean;
  [ModuleType.ENGINEERING]: boolean;
  [ModuleType.TIME_TRACKING]: boolean;
  [ModuleType.TASKS]: boolean;
  [ModuleType.CHAT]: boolean;
}

export interface User {
  id: string;
  login: string;
  password?: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  permissions: UserPermissions;
  position?: string;
  phone?: string;
  email?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  hireDate: string;
  resumeUrl: string;
  history: HistoryEvent[];
  phone?: string;
  address?: string;
  email?: string;
}

export interface HistoryEvent {
  id: string;
  date: string;
  type: 'AWARD' | 'PROMOTION' | 'PENALTY' | 'OTHER';
  description: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  size: string;
}

export interface ChatPollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface ChatPoll {
  question: string;
  options: ChatPollOption[];
  isClosed?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  voiceUrl?: string;
  attachments?: ChatAttachment[];
  poll?: ChatPoll;
  type: 'text' | 'voice' | 'file' | 'poll';
  timestamp: string;
  replyToId?: string;
  reactions?: Record<string, string[]>;
  mentions?: string[];
  isEdited?: boolean;
  forwardedFrom?: string;
  readBy?: string[];
}

export interface Chat {
  id: string;
  name: string;
  type: ChatType;
  creatorId: string;
  participantIds: string[];
  lastMessage?: string;
  updatedAt: string;
  messages: ChatMessage[];
  isMandatory?: boolean;
  pinnedMessageIds?: string[];
  isUnread?: boolean;
}

export interface CallParticipant {
  id: string;
  name: string;
  role: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  isExternal?: boolean;
}

export interface ActiveCall {
  id: string;
  type: 'AUDIO' | 'VIDEO';
  startTime: string;
  participants: CallParticipant[];
}

export interface Contractor {
  id: string;
  name: string;
  object: string;
  progress: number;
  updatedAt: string;
  advance: {
    paid: boolean;
    amount?: number;
    date?: string;
  };
  documents: ContractDocument[];
  workers: ContractorWorker[];
  transport: TransportInfo[];
}

export interface ContractorWorker {
  id: string;
  fullName: string;
  passNumber: string;
  expiryDate: string;
}

export interface TransportInfo {
  id: string;
  model: string;
  plate: string;
  passExpiry: string;
}

export interface ContractDocument {
  id: string;
  type: 'CONTRACT' | 'ESTIMATE' | 'INVOICE' | 'ACT' | 'SCHEME';
  name: string;
  date: string;
  url: string;
}

export interface AIDocumentAnalysis {
  extractedDate: string;
  extractedAmount: string;
  status: string;
  discrepancies: string[];
  summary: string;
}

export interface TimeSheetEntry {
  employeeId: string;
  date: string;
  hours: number;
  status: 'WORK' | 'VACATION' | 'SICK' | 'OFF';
}

export interface AIPrediction {
  status: 'ON_TIME' | 'DELAYED' | 'RISK';
  predictionText: string;
  delayDays: number;
  fineRecommendation: string;
  fineReason: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface TaskAIAnalysis {
  improvements: string;
  duplicates: string[];
  estimatedHours: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  creatorId: string;
  deadline: string;
  status: TaskStatus;
  projectId: string;
  attachments: TaskAttachment[];
  comments: TaskComment[];
  reminderEnabled?: boolean;
}

export interface TaskProject {
  id: string;
  name: string;
  description: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'TASK' | 'SYSTEM' | 'ALERT';
  createdAt: string;
  isRead: boolean;
}
