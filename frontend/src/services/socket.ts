import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

class SocketService {
  private socket: Socket;
  private connected: boolean = false;

  constructor() {
    console.log('Initializing socket connection...');
    this.socket = io('http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected successfully:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.connected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });
  }

  isConnected(): boolean {
    return this.connected && this.socket.connected;
  }

  // User room methods for direct messages
  joinUser(userId: string) {
    if (this.isConnected()) {
      console.log('Joining user room:', userId);
      this.socket.emit('joinUser', userId);
    } else {
      console.error('Cannot join user room - socket not connected');
    }
  }

  leaveUser(userId: string) {
    if (this.isConnected()) {
      console.log('Leaving user room:', userId);
      this.socket.emit('leaveUser', userId);
    }
  }

  // Group room methods
  joinGroup(groupId: string) {
    if (this.isConnected()) {
      console.log('Joining group room:', groupId);
      this.socket.emit('joinGroup', groupId);
    } else {
      console.error('Cannot join group room - socket not connected');
    }
  }

  leaveGroup(groupId: string) {
    if (this.isConnected()) {
      this.socket.emit('leaveGroup', groupId);
    }
  }

  // Send group message
  sendMessage(groupId: string, senderId: string, text: string) {
    if (this.isConnected()) {
      console.log('Sending group message:', { groupId, senderId, text });
      this.socket.emit('sendMessage', { groupId, senderId, text });
    } else {
      console.error('Cannot send group message - socket not connected');
      throw new Error('Socket not connected');
    }
  }

  // Send direct message
  sendDirectMessage(senderId: string, receiverId: string, text: string) {
    if (this.isConnected()) {
      console.log('Sending direct message via socket:', { senderId, receiverId, text });
      this.socket.emit('sendDirectMessage', { senderId, receiverId, text });
    } else {
      console.error('Cannot send direct message - socket not connected');
      throw new Error('Socket not connected');
    }
  }

  // Listen for group messages
  onMessage(handler: (message: Message) => void) {
    this.socket.on('message', handler);
    return () => {
      this.socket.off('message', handler);
    };
  }

  // Listen for direct messages
  onDirectMessage(handler: (message: Message) => void) {
    // Remove any existing listeners first to prevent duplicates
    this.socket.off('directMessage');
    
    this.socket.on('directMessage', (message: Message) => {
      console.log('Received direct message via socket:', message._id, message.text);
      handler(message);
    });
    return () => {
      this.socket.off('directMessage', handler);
    };
  }

  // Listen for message errors
  onMessageError(handler: (error: { error: string; details: string }) => void) {
    this.socket.on('messageError', (error) => {
      console.error('Received socket message error details:', {
        error: error.error,
        details: error.details,
        fullError: JSON.stringify(error, null, 2)
      });
      handler(error);
    });
    return () => {
      this.socket.off('messageError', handler);
    };
  }

  disconnect() {
    console.log('Disconnecting socket...');
    this.socket.disconnect();
  }

  // Force reconnection
  reconnect() {
    console.log('Force reconnecting socket...');
    this.socket.disconnect();
    this.socket.connect();
  }
}

export default new SocketService(); 