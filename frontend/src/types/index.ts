export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  regNo: string;
  role: 'student' | 'teacher' | 'hod' | 'admin';
  department?: string;
  year?: number;
  profilePic?: string;
}

export interface Message {
  _id: string;
  groupId?: string;
  senderId: User;
  receiverId?: User;
  text: string;
  messageType: 'group' | 'direct';
  timestamp: string;
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  members: User[];
  admins: User[];
  createdBy: User;
  createdAt: string;
  department?: string;
  year?: number;
  type: 'department' | 'class' | 'general';
  lastMessage?: Message;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginFormData {
  regNo: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  regNo: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  year: number;
}

export interface DirectMessageContact {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface DirectMessageConversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  updatedAt: string;
} 