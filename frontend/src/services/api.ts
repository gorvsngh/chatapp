import axios from 'axios';
import { AuthResponse, LoginFormData, RegisterFormData, Group, Message, User, DirectMessageContact } from '../types';

const API_URL = 'https://chatapp-backend-4e4a.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear localStorage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const groupAPI = {
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get('/groups');
    return response.data;
  },
  discoverGroups: async (): Promise<Group[]> => {
    const response = await api.get('/groups/discover');
    return response.data;
  },
  createGroup: async (data: { name: string; description: string; type: string; department?: string; year?: number; members: string[] }): Promise<Group> => {
    const response = await api.post('/groups', data);
    return response.data;
  },
  getGroupMessages: async (groupId: string, page: number = 1, limit: number = 20): Promise<{
    messages: Message[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalMessages: number;
      hasMore: boolean;
    };
  }> => {
    const response = await api.get(`/groups/${groupId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },
  joinGroup: async (groupId: string): Promise<{ msg: string; group: Group }> => {
    const response = await api.post(`/groups/${groupId}/join`);
    return response.data;
  },
  leaveGroup: async (groupId: string): Promise<{ msg: string }> => {
    const response = await api.post(`/groups/${groupId}/leave`);
    return response.data;
  },
  addMemberToGroup: async (groupId: string, userId: string): Promise<{ msg: string; group: Group }> => {
    const response = await api.post(`/groups/${groupId}/members`, { userId });
    return response.data;
  },
  removeMemberFromGroup: async (groupId: string, userId: string): Promise<{ msg: string; group: Group }> => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },
};

export const adminAPI = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Users Management
  getUsers: async (params?: { page?: number; limit?: number; role?: string; department?: string; search?: string }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  createUser: async (data: { name: string; regNo: string; password: string; role: string; department: string; year: number }) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },
  uploadUsers: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/users/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  updateUser: async (userId: string, data: { name: string; role: string; department: string; year: number }) => {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  },
  deleteUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Groups Management
  getGroups: async (params?: { page?: number; limit?: number; type?: string; department?: string; search?: string }) => {
    const response = await api.get('/admin/groups', { params });
    return response.data;
  },
  updateGroup: async (groupId: string, data: { name: string; description: string; type: string; department?: string }) => {
    const response = await api.put(`/admin/groups/${groupId}`, data);
    return response.data;
  },
  deleteGroup: async (groupId: string) => {
    const response = await api.delete(`/admin/groups/${groupId}`);
    return response.data;
  },

  // Messages Management
  getMessages: async (params?: { page?: number; limit?: number; groupId?: string; senderId?: string }) => {
    const response = await api.get('/admin/messages', { params });
    return response.data;
  },
  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/admin/messages/${messageId}`);
    return response.data;
  },
};

export const userAPI = {
  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
  getAllUsers: async (params?: { page?: number; limit?: number; department?: string; year?: number; role?: string }): Promise<{
    users: User[];
    total: number;
    page: number;
    pages: number;
  }> => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  sendDirectMessage: async (receiverId: string, text: string): Promise<Message> => {
    const response = await api.post('/users/direct-message', { receiverId, text });
    return response.data;
  },
  getDirectMessages: async (userId: string): Promise<Message[]> => {
    const response = await api.get(`/users/${userId}/messages`);
    return response.data;
  },
  getDirectMessageContacts: async (): Promise<DirectMessageContact[]> => {
    const response = await api.get('/users/direct-contacts');
    return response.data;
  },
};

export default api; 