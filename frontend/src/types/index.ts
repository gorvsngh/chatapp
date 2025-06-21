export interface User {
  _id: string;
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
  groupId: string;
  senderId: User;
  text: string;
  createdAt: string;
  attachments?: Array<{
    type: 'image' | 'document';
    url: string;
    name: string;
  }>;
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
  rememberMe?: boolean;
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