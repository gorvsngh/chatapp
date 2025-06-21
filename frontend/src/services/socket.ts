import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:5000', {
      autoConnect: false, // Connect manually
    });
    this.socket.connect();
  }

  joinGroup(groupId: string) {
    this.socket.emit('joinGroup', groupId);
  }

  leaveGroup(groupId: string) {
    this.socket.emit('leaveGroup', groupId);
  }

  sendMessage(groupId: string, senderId: string, text: string) {
    this.socket.emit('sendMessage', { groupId, senderId, text });
  }

  onMessage(handler: (message: Message) => void) {
    this.socket.on('message', handler);
    return () => {
      this.socket.off('message', handler);
    };
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export const socketService = new SocketService();
export default socketService; 