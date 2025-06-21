import axios from 'axios';
import { AuthResponse, LoginFormData, RegisterFormData, Group, Message } from '../types';

const API_URL = 'http://localhost:5000';

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
  createGroup: async (data: { name: string; description: string; type: string; department?: string; year?: number; members: string[] }): Promise<Group> => {
    const response = await api.post('/groups', data);
    return response.data;
  },
  getGroupMessages: async (groupId: string): Promise<Message[]> => {
    const response = await api.get(`/groups/${groupId}/messages`);
    return response.data;
  },
  joinGroup: async (groupId: string): Promise<void> => {
    await api.post(`/groups/${groupId}/join`);
  },
  leaveGroup: async (groupId: string): Promise<void> => {
    await api.post(`/groups/${groupId}/leave`);
  },
};

export default api; 